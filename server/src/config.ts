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
  NODE_ENV: process.env.NODE_ENV || "development",
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_QUESTION_MODEL: process.env.GROQ_QUESTION_MODEL || "llama-3.1-8b-instant",
  GROQ_EVALUATION_MODEL: process.env.GROQ_EVALUATION_MODEL || "llama-3.3-70b-versatile",
  GROQ_RESUME_MODEL: process.env.GROQ_RESUME_MODEL || "llama-3.3-70b-versatile",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
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
