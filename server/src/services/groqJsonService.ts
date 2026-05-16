import Groq from "groq-sdk";
import type { z } from "zod";

import { config } from "../config.js";
import { logger } from "../logger.js";

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GenerateGroqJsonInput<TSchema extends z.ZodTypeAny> = {
  fallback?: z.infer<TSchema>;
  maxAttempts?: number;
  messages: GroqMessage[];
  model: string;
  schema: TSchema;
  serviceName: string;
  temperature: number;
};

let groqClient: Groq | null = null;

const getGroqClient = () => {
  if (!config.GROQ_API_KEY) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: config.GROQ_API_KEY });
  }

  return groqClient;
};

export const generateGroqJson = async <TSchema extends z.ZodTypeAny>({
  fallback,
  maxAttempts = 1,
  messages,
  model,
  schema,
  serviceName,
  temperature
}: GenerateGroqJsonInput<TSchema>): Promise<z.infer<TSchema>> => {
  const groq = getGroqClient();

  if (!groq) {
    if (fallback !== undefined) {
      return fallback;
    }

    throw new Error("Groq client is unavailable.");
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const completion = await groq.chat.completions.create({
        messages,
        model,
        temperature
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Groq returned empty response.");
      }

      return schema.parse(JSON.parse(content));
    } catch (error) {
      lastError = error;

      logger.warn("Groq JSON generation attempt failed safely", {
        attempt,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorName: error instanceof Error ? error.name : "UnknownError",
        maxAttempts,
        service: serviceName
      });
    }
  }

  if (fallback !== undefined) {
    logger.error("Groq JSON generation exhausted retries and used fallback", {
      errorMessage: lastError instanceof Error ? lastError.message : "Unknown error",
      errorName: lastError instanceof Error ? lastError.name : "UnknownError",
      maxAttempts,
      service: serviceName
    });

    return fallback;
  }

  throw lastError instanceof Error ? lastError : new Error("Groq JSON generation failed.");
};
