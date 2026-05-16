import { z } from "zod";

import { config } from "../config.js";
import { logger } from "../logger.js";
import { generateGroqJson } from "./groqJsonService.js";

export type InterviewQuestionInput = {
  jobRole: string;
  category: string;
  difficulty: string;
  company?: string;
  previousQuestions?: string[];
};

export class InterviewGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterviewGenerationError";
  }
}

const MAX_QUESTION_WORDS = 22;
const MAX_QUESTION_LENGTH = 180;
const MAX_GENERATION_ATTEMPTS = 3;

const questionSchema = z
  .object({
    question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH)
  })
  .strict();

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const isHardDifficulty = (difficulty: string) => normalizeText(difficulty).includes("hard");

const isMultiSentenceQuestion = (question: string) => (question.match(/[.!?]+/g) || []).length > 1;

const normalizeQuestion = (question: string) =>
  question
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ");

const isQuestionConciseEnough = (question: string, difficulty: string) => {
  const normalizedQuestion = normalizeQuestion(question);

  if (countWords(normalizedQuestion) > MAX_QUESTION_WORDS) {
    return false;
  }

  if (!isHardDifficulty(difficulty) && isMultiSentenceQuestion(normalizedQuestion)) {
    return false;
  }

  return normalizedQuestion.length <= MAX_QUESTION_LENGTH;
};

const getPromptAdjustment = (attempt: number) => {
  if (attempt === 1) {
    return "Generate the best possible question on the first try.";
  }

  if (attempt === 2) {
    return "Your previous attempt was not acceptable. Make the next question shorter, sharper, and clearly distinct from the previous list.";
  }

  return "Final retry. Return one highly readable, role-specific question that is clearly different from the previous list and fully obeys every rule.";
};

const createInterviewMessages = (input: InterviewQuestionInput, attempt: number) => {
  const previousQuestions = input.previousQuestions?.length
    ? input.previousQuestions.map((question) => `- ${question}`).join("\n")
    : "- None";
  const companyLine = input.company
    ? `Target company: ${input.company}`
    : "Target company: general";

  return [
    {
      role: "system" as const,
      content: `You are a senior interview coach and question designer.

Your job is to write exactly one interview question that feels realistic for a live interviewer.
The question must be tailored to the candidate's job role, category, and difficulty.
Avoid generic filler. Ask something a strong interviewer would actually ask.

Rules you must follow:
- Return exactly one interview question.
- Keep it to one sentence.
- Keep it under ${MAX_QUESTION_WORDS} words and under ${MAX_QUESTION_LENGTH} characters.
- Ask one clear thing only.
- Do not include explanations, labels, numbering, or markdown.
- For easy and medium difficulty, do not ask multi-part questions.
- Make the wording natural, conversational, and easy to read on mobile.
- Respect the requested category:
  - HR: motivation, strengths, self-awareness, communication, culture fit.
  - Behavioral: past experience, ownership, teamwork, conflict, decision-making, impact.
  - Technical: architecture, debugging, tradeoffs, implementation, performance, systems thinking.
  - Company: company motivation, product interest, first 30 days, role fit for that company.

Respond with strict JSON only:
{"question":"..."}`
    },
    {
      role: "user" as const,
      content: `Create one interview question for this candidate.

Job role: ${input.jobRole}
Category: ${input.category}
Difficulty: ${input.difficulty}
${companyLine}

Do not repeat or closely paraphrase any of these previous questions:
${previousQuestions}

Additional instruction:
${getPromptAdjustment(attempt)}`
    }
  ];
};

export const generateInterviewQuestion = async (input: InterviewQuestionInput) => {
  const previous = new Set((input.previousQuestions || []).map(normalizeText));
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const parsedQuestion = await generateGroqJson({
        maxAttempts: 2,
        messages: createInterviewMessages(input, attempt),
        model: config.GROQ_QUESTION_MODEL,
        schema: questionSchema,
        serviceName: "interviewService",
        temperature: attempt === 1 ? 0.45 : 0.35
      });

      const normalizedQuestion = normalizeQuestion(parsedQuestion.question);

      if (
        previous.has(normalizeText(normalizedQuestion)) ||
        !isQuestionConciseEnough(normalizedQuestion, input.difficulty)
      ) {
        lastError = new Error("Model returned a repeated or invalid-length question.");
        continue;
      }

      return {
        question: normalizedQuestion
      };
    } catch (error) {
      lastError = error;
    }
  }

  logger.error("Interview question generation failed after retries", {
    category: input.category,
    difficulty: input.difficulty,
    errorMessage: lastError instanceof Error ? lastError.message : "Unknown error",
    errorName: lastError instanceof Error ? lastError.name : "UnknownError",
    jobRole: input.jobRole,
    previousQuestionCount: input.previousQuestions?.length || 0
  });

  throw new InterviewGenerationError(
    "Could not generate a fresh interview question right now. Please try again."
  );
};
