import "dotenv/config";

const normalizePrivateKey = (privateKey?: string) => privateKey?.replace(/\\n/g, "\n");
const parsePort = (value?: string) => {
  const port = Number(value || 3000);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("Invalid PORT. Expected a number between 1 and 65535.");
  }

  return port;
};

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
  PORT: parsePort(process.env.PORT),
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

if (config.NODE_ENV === "production") {
  const missingConfig = [
    ["FIREBASE_PROJECT_ID", config.FIREBASE_PROJECT_ID],
    ["FIREBASE_CLIENT_EMAIL", config.FIREBASE_CLIENT_EMAIL],
    ["FIREBASE_PRIVATE_KEY", config.FIREBASE_PRIVATE_KEY],
    ["GROQ_API_KEY", config.GROQ_API_KEY]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingConfig.length) {
    throw new Error(`Missing required production config: ${missingConfig.join(", ")}`);
  }
}
