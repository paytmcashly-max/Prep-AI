import Groq from "groq-sdk";
import type { z } from "zod";

import { config } from "../config.js";
import { logger } from "../logger.js";

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GenerateGroqJsonInput<TSchema extends z.ZodTypeAny> = {
  fallback: z.infer<TSchema>;
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
  messages,
  model,
  schema,
  serviceName,
  temperature
}: GenerateGroqJsonInput<TSchema>): Promise<z.infer<TSchema>> => {
  const groq = getGroqClient();

  if (!groq) {
    return fallback;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      logger.warn("Groq returned empty response", {
        service: serviceName
      });
      return fallback;
    }

    return schema.parse(JSON.parse(content));
  } catch (error) {
    logger.error("Groq JSON generation failed safely", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorName: error instanceof Error ? error.name : "UnknownError",
      service: serviceName
    });

    return fallback;
  }
};
