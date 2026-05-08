import admin from "firebase-admin";

import { config } from "./config.js";

export const getFirebaseAdmin = () => {
  if (admin.apps.length) {
    return admin;
  }

  const projectId = config.FIREBASE_PROJECT_ID;
  const clientEmail = config.FIREBASE_CLIENT_EMAIL;
  const privateKey = config.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables.");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  return admin;
};
