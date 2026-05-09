import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request } from "express";

import type { AuthenticatedRequest } from "./authMiddleware.js";
import { hasActivePremiumSubscription } from "./services/usageService.js";

const freeRequestLimit = 20;
const premiumRequestLimit = 120;

const getAuthenticatedUid = (request: Request) => {
  const authenticatedRequest = request as unknown as AuthenticatedRequest;

  return authenticatedRequest.user?.uid;
};

export const interviewRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: async (request) => {
    const uid = getAuthenticatedUid(request);

    if (!uid) {
      return freeRequestLimit;
    }

    const isPremium = await hasActivePremiumSubscription(uid);

    return isPremium ? premiumRequestLimit : freeRequestLimit;
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (request) => {
    const uid = getAuthenticatedUid(request);

    return uid || ipKeyGenerator(request.ip || "unknown");
  },
  message: {
    error: "Too many interview requests. Please try again later."
  }
});
