import Groq, { toFile } from "groq-sdk";

import { config } from "../config.js";
import { logger } from "../logger.js";

export const MAX_VOICE_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_VOICE_DURATION_SECONDS = 120;

export class VoiceTranscriptionProviderError extends Error {
  constructor(message = "Voice transcription is unavailable right now.") {
    super(message);
    this.name = "VoiceTranscriptionProviderError";
  }
}

export class VoiceDurationLimitError extends Error {
  constructor(message = "Audio must be 2 minutes or shorter.") {
    super(message);
    this.name = "VoiceDurationLimitError";
  }
}

export class VoiceTranscriptionTimeoutError extends VoiceTranscriptionProviderError {
  constructor(message = "Voice transcription timed out. Please try again.") {
    super(message);
    this.name = "VoiceTranscriptionTimeoutError";
  }
}

type TranscribeVoiceInput = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

type GroqVerboseTranscriptionResponse = {
  duration?: number;
  language?: string;
  text?: string;
};

let groqClient: Groq | null = null;

const getGroqClient = () => {
  if (!config.GROQ_API_KEY) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: config.GROQ_API_KEY });
  }

  return groqClient;
};

const getSafeDurationSeconds = (value: unknown) => {
  const duration = Number(value);

  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  return Math.round(duration * 100) / 100;
};

const withVoiceTranscriptionTimeout = async <T>(promise: Promise<T>) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeoutId = setTimeout(
          () => reject(new VoiceTranscriptionTimeoutError()),
          config.VOICE_TRANSCRIPTION_TIMEOUT_MS
        );
      })
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const transcribeVoiceAudio = async ({
  buffer,
  mimetype,
  originalname
}: TranscribeVoiceInput) => {
  const groq = getGroqClient();

  if (!groq) {
    throw new VoiceTranscriptionProviderError();
  }

  try {
    logger.info("Voice transcription request received", {
      fileSizeBytes: buffer.byteLength,
      mimeType: mimetype,
      model: config.GROQ_STT_MODEL
    });

    const response = (await withVoiceTranscriptionTimeout(
      groq.audio.transcriptions.create({
        file: await toFile(buffer, originalname || "voice-answer.webm", { type: mimetype }),
        language: "en",
        model: config.GROQ_STT_MODEL,
        response_format: "verbose_json",
        temperature: 0
      })
    )) as GroqVerboseTranscriptionResponse;

    const transcript = typeof response.text === "string" ? response.text.trim() : "";

    if (!transcript) {
      throw new VoiceTranscriptionProviderError();
    }

    const durationSeconds = getSafeDurationSeconds(response.duration);

    // Best-effort beta guard until we add server-side media probing before provider upload.
    if (durationSeconds > MAX_VOICE_DURATION_SECONDS) {
      throw new VoiceDurationLimitError();
    }

    logger.info("Voice transcription completed", {
      durationSeconds,
      mimeType: mimetype,
      model: config.GROQ_STT_MODEL
    });

    return {
      durationSeconds,
      language: typeof response.language === "string" ? response.language : "en",
      transcript
    };
  } catch (error) {
    if (
      error instanceof VoiceDurationLimitError ||
      error instanceof VoiceTranscriptionTimeoutError
    ) {
      throw error;
    }

    logger.error("Groq voice transcription failed safely", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorName: error instanceof Error ? error.name : "UnknownError",
      model: config.GROQ_STT_MODEL
    });

    throw new VoiceTranscriptionProviderError();
  }
};
