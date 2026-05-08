import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import type { AuthenticatedRequest } from "./authMiddleware.js";

export const interviewRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (request) => {
    const authenticatedRequest = request as AuthenticatedRequest;

    return authenticatedRequest.user?.uid || ipKeyGenerator(request.ip || "unknown");
  },
  message: {
    error: "Too many interview requests. Please try again later."
  }
});
