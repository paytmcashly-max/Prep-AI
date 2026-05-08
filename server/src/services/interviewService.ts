import Groq from "groq-sdk";
import { z } from "zod";

import { config } from "../config.js";
import { logger } from "../logger.js";

export type InterviewQuestionInput = {
  jobRole: string;
  category: string;
  difficulty: string;
  company?: string;
  previousQuestions?: string[];
};

const questionSchema = z.object({
  question: z.string().trim().min(1).max(500)
});

const fallbackQuestions: Record<string, string[]> = {
  behavioral: [
    "Describe a time you handled a difficult situation at work.",
    "Tell me about a time you received critical feedback and how you acted on it.",
    "Give an example of a time you took ownership of a problem.",
    "Tell me about a time you had to work with a difficult teammate.",
    "Describe a time you used the STAR method to explain your impact."
  ],
  company: [
    "Why do you want to work at this company?",
    "What do you know about this company and its products?",
    "How would your skills help this company succeed?",
    "Which company value or product area connects most with your experience?",
    "How would you prepare for your first 30 days at this company?"
  ],
  hr: [
    "Tell me about yourself.",
    "Why should we hire you for this role?",
    "What are your strengths and weaknesses?",
    "Where do you see yourself in the next two years?",
    "Why are you interested in this position?"
  ],
  technical: [
    "Explain a technical project you built and the tradeoffs you made.",
    "How do you debug a production issue under time pressure?",
    "Describe how you would design a scalable feature for many users.",
    "Walk me through how you would optimize a slow API or screen.",
    "How do you decide between two technical approaches when both have tradeoffs?"
  ]
};

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const getFallbackQuestionBank = (category: string) => {
  const normalizedCategory = normalizeText(category);

  if (normalizedCategory.includes("behavior")) {
    return fallbackQuestions.behavioral;
  }

  if (normalizedCategory.includes("company")) {
    return fallbackQuestions.company;
  }

  if (normalizedCategory.includes("tech")) {
    return fallbackQuestions.technical;
  }

  return fallbackQuestions.hr;
};

const pickFallbackQuestion = (input: InterviewQuestionInput) => {
  const previous = new Set((input.previousQuestions || []).map(normalizeText));
  const bank = getFallbackQuestionBank(input.category);
  const availableQuestion = bank.find((question) => !previous.has(normalizeText(question)));

  return {
    question: availableQuestion || bank[previous.size % bank.length]
  };
};

export const generateInterviewQuestion = async (input: InterviewQuestionInput) => {
  const apiKey = config.GROQ_API_KEY;

  if (!apiKey) {
    return pickFallbackQuestion(input);
  }

  const groq = new Groq({ apiKey });
  const model = config.GROQ_QUESTION_MODEL;
  const previousQuestions = input.previousQuestions?.length
    ? input.previousQuestions.map((question) => `- ${question}`).join("\n")
    : "- None";
  const companyLine = input.company
    ? `Target company: ${input.company}`
    : "Target company: general";

  try {
    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are an expert interview coach. Generate one fresh interview question. Respond ONLY in valid JSON with no markdown or extra text."
        },
        {
          role: "user",
          content: `Create one interview question for this candidate.

Job role: ${input.jobRole}
Category: ${input.category}
Difficulty: ${input.difficulty}
${companyLine}

Avoid repeating or closely paraphrasing these previous questions:
${previousQuestions}

Return strict JSON:
{
  "question": "one concise question"
}`
        }
      ]
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      logger.warn("Groq question generation returned empty response", {
        service: "interviewService"
      });
      return pickFallbackQuestion(input);
    }

    const parsedQuestion = questionSchema.parse(JSON.parse(content));
    const previous = new Set((input.previousQuestions || []).map(normalizeText));

    if (previous.has(normalizeText(parsedQuestion.question))) {
      return pickFallbackQuestion(input);
    }

    return parsedQuestion;
  } catch (error) {
    logger.error("Groq question generation failed safely", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorName: error instanceof Error ? error.name : "UnknownError",
      service: "interviewService"
    });

    return pickFallbackQuestion(input);
  }
};
