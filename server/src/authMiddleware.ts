import type { NextFunction, Request, Response } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";

import { getFirebaseAdmin } from "./firebaseAdmin.js";

export type AuthenticatedRequest = Request & {
  user?: DecodedIdToken;
};

export const requireFirebaseAuth = async (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) => {
  try {
    const authorization = request.header("authorization") || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      response.status(401).json({ error: "Authentication required." });
      return;
    }

    request.user = await getFirebaseAdmin().auth().verifyIdToken(token);
    next();
  } catch {
    response.status(401).json({ error: "Authentication required." });
  }
};
