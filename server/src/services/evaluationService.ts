import Groq from "groq-sdk";
import { z } from "zod";

import { config } from "../config.js";
import { logger } from "../logger.js";

export type EvaluateInterviewAnswerInput = {
  question: string;
  answer: string;
  jobRole: string;
};

export type InterviewEvaluation = {
  score: number;
  strengths: string[];
  improvements: string[];
  idealAnswer: string;
};

const fallbackEvaluation: InterviewEvaluation = {
  score: 5,
  strengths: ["Clear attempt"],
  improvements: ["Add more specific examples"],
  idealAnswer: "A strong answer should be structured, specific, and relevant to the role."
};

const evaluationSchema = z.object({
  score: z.number().min(0).max(10),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  idealAnswer: z.string()
});

export const evaluateInterviewAnswer = async (
  input: EvaluateInterviewAnswerInput
): Promise<InterviewEvaluation> => {
  const apiKey = config.GROQ_API_KEY;

  if (!apiKey) {
    return fallbackEvaluation;
  }

  const groq = new Groq({ apiKey });
  const model = config.GROQ_EVALUATION_MODEL;

  try {
    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an expert interview coach. Respond ONLY in valid JSON with no markdown or extra text."
        },
        {
          role: "user",
          content: `Evaluate this interview answer for a ${input.jobRole} candidate.

Question:
${input.question}

Candidate answer:
${input.answer}

Return strict JSON in this exact shape:
{
  "score": number,
  "strengths": string[],
  "improvements": string[],
  "idealAnswer": string
}`
        }
      ]
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      logger.warn("Groq evaluation returned empty response", {
        service: "evaluationService"
      });
      return fallbackEvaluation;
    }

    return evaluationSchema.parse(JSON.parse(content));
  } catch (error) {
    logger.error("Groq evaluation failed safely", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorName: error instanceof Error ? error.name : "UnknownError",
      service: "evaluationService"
    });

    return fallbackEvaluation;
  }
};
