import "dotenv/config";

const normalizePrivateKey = (privateKey?: string) => privateKey?.replace(/\\n/g, "\n");

export type ServerConfig = {
  PORT: number;
  CORS_ORIGIN?: string;
  NODE_ENV: string;
  GROQ_API_KEY?: string;
  GROQ_QUESTION_MODEL: string;
  GROQ_EVALUATION_MODEL: string;
  GROQ_RESUME_MODEL: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
};

export const config: ServerConfig = {
  PORT: Number(process.env.PORT || 3000),
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  NODE_ENV: process.env.NODE_ENV || "development",
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_QUESTION_MODEL: process.env.GROQ_QUESTION_MODEL || "llama-3.1-8b-instant",
  GROQ_EVALUATION_MODEL: process.env.GROQ_EVALUATION_MODEL || "llama-3.3-70b-versatile",
  GROQ_RESUME_MODEL: process.env.GROQ_RESUME_MODEL || "llama-3.3-70b-versatile",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
};
