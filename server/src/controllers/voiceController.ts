import type { Request, Response, NextFunction } from "express";

import {
  transcribeVoiceAudio,
  VoiceDurationLimitError,
  VoiceTranscriptionProviderError
} from "../services/voiceService.js";

export const transcribeVoiceController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  if (!request.file) {
    response.status(400).json({
      error: "Please upload an audio file."
    });
    return;
  }

  try {
    const transcription = await transcribeVoiceAudio({
      buffer: request.file.buffer,
      mimetype: request.file.mimetype,
      originalname: request.file.originalname
    });

    response.json(transcription);
  } catch (error) {
    if (
      error instanceof VoiceDurationLimitError ||
      error instanceof VoiceTranscriptionProviderError
    ) {
      next(error);
      return;
    }

    next(error);
  } finally {
    if (request.file?.buffer) {
      request.file.buffer.fill(0);
    }
  }
};
