import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";

import { requireFirebaseAuth } from "../authMiddleware.js";
import { transcribeVoiceController } from "../controllers/voiceController.js";
import { interviewRateLimit } from "../rateLimitMiddleware.js";
import {
  MAX_VOICE_UPLOAD_SIZE_BYTES,
  VoiceDurationLimitError,
  VoiceTranscriptionProviderError
} from "../services/voiceService.js";
import { requireVoiceFeatureEnabled } from "../voiceFeatureMiddleware.js";

class UnsupportedVoiceFileTypeError extends Error {
  constructor(message = "Unsupported audio format.") {
    super(message);
    this.name = "UnsupportedVoiceFileTypeError";
  }
}

const supportedVoiceMimeTypes = new Set([
  "audio/flac",
  "audio/m4a",
  "audio/mp3",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-flac",
  "audio/x-m4a",
  "audio/x-wav",
  "audio/wave"
]);

const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VOICE_UPLOAD_SIZE_BYTES
  },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype?.startsWith("audio/") || !supportedVoiceMimeTypes.has(file.mimetype)) {
      callback(new UnsupportedVoiceFileTypeError());
      return;
    }

    callback(null, true);
  }
});

const voiceRouter = Router();

voiceRouter.post(
  "/transcribe",
  requireVoiceFeatureEnabled,
  requireFirebaseAuth,
  interviewRateLimit,
  voiceUpload.single("audio"),
  transcribeVoiceController
);

voiceRouter.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
  if (error instanceof UnsupportedVoiceFileTypeError) {
    response.status(415).json({
      error: "Unsupported audio format."
    });
    return;
  }

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    response.status(413).json({
      error: "Audio file must be 10MB or smaller."
    });
    return;
  }

  if (error instanceof VoiceDurationLimitError) {
    response.status(413).json({
      error: error.message
    });
    return;
  }

  if (error instanceof VoiceTranscriptionProviderError) {
    response.status(503).json({
      error: error.message
    });
    return;
  }

  next(error);
});

export default voiceRouter;
