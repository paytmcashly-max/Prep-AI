import type { NextFunction, Request, Response } from "express";

import { config } from "./config.js";

export const requireVoiceFeatureEnabled = (
  _request: Request,
  response: Response,
  next: NextFunction
) => {
  if (!config.ENABLE_VOICE_FEATURE) {
    response.status(404).json({
      error: "Voice feature is not available"
    });
    return;
  }

  next();
};

// TODO(voice): Apply this middleware to future voice interview routes before the
// auth, rate-limit, upload, and transcription handlers so the feature stays dark by default.
