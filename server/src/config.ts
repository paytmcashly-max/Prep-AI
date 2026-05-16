import "dotenv/config";

const normalizePrivateKey = (privateKey?: string) => privateKey?.replace(/\\n/g, "\n");
const parsePort = (value?: string) => {
  const port = Number(value || 3000);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("Invalid PORT. Expected a number between 1 and 65535.");
  }

  return port;
};

const parseBooleanFlag = (value?: string) => value === "true";
const parsePositiveInteger = (value: string | undefined, fallback: number, label: string) => {
  const parsed = Number(value || fallback);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label}. Expected a positive integer.`);
  }

  return parsed;
};

export type ServerConfig = {
  PORT: number;
  CORS_ORIGIN?: string;
  ENABLE_VOICE_FEATURE: boolean;
  VOICE_TRANSCRIPTION_TIMEOUT_MS: number;
  NODE_ENV: string;
  GROQ_API_KEY?: string;
  GROQ_STT_MODEL: string;
  GROQ_QUESTION_MODEL: string;
  GROQ_EVALUATION_MODEL: string;
  GROQ_RESUME_MODEL: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_REPLY_TO?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  RAZORPAY_PREMIUM_MONTHLY_AMOUNT?: number;
  RAZORPAY_PREMIUM_YEARLY_AMOUNT?: number;
  APP_PUBLIC_URL?: string;
};

const parseOptionalPositiveInteger = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid Razorpay amount. Expected a positive integer in paise.");
  }

  return parsed;
};

export const config: ServerConfig = {
  PORT: parsePort(process.env.PORT),
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  ENABLE_VOICE_FEATURE: parseBooleanFlag(process.env.ENABLE_VOICE_FEATURE),
  VOICE_TRANSCRIPTION_TIMEOUT_MS: parsePositiveInteger(
    process.env.VOICE_TRANSCRIPTION_TIMEOUT_MS,
    30000,
    "VOICE_TRANSCRIPTION_TIMEOUT_MS"
  ),
  NODE_ENV: process.env.NODE_ENV || "development",
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_STT_MODEL: process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo",
  GROQ_QUESTION_MODEL: process.env.GROQ_QUESTION_MODEL || "llama-3.3-70b-versatile",
  GROQ_EVALUATION_MODEL: process.env.GROQ_EVALUATION_MODEL || "llama-3.3-70b-versatile",
  GROQ_RESUME_MODEL: process.env.GROQ_RESUME_MODEL || "llama-3.3-70b-versatile",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  RAZORPAY_PREMIUM_MONTHLY_AMOUNT: parseOptionalPositiveInteger(
    process.env.RAZORPAY_PREMIUM_MONTHLY_AMOUNT
  ),
  RAZORPAY_PREMIUM_YEARLY_AMOUNT: parseOptionalPositiveInteger(
    process.env.RAZORPAY_PREMIUM_YEARLY_AMOUNT
  ),
  APP_PUBLIC_URL: process.env.APP_PUBLIC_URL
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
