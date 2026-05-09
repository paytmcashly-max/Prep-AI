import { z } from "zod";

import { config } from "../config.js";
import { generateGroqJson } from "./groqJsonService.js";

export type InterviewQuestionInput = {
  jobRole: string;
  category: string;
  difficulty: string;
  company?: string;
  previousQuestions?: string[];
};

const MAX_QUESTION_WORDS = 22;
const MAX_QUESTION_LENGTH = 180;

const questionSchema = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH)
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
  const fallbackQuestion = pickFallbackQuestion(input);
  const previousQuestions = input.previousQuestions?.length
    ? input.previousQuestions.map((question) => `- ${question}`).join("\n")
    : "- None";
  const companyLine = input.company
    ? `Target company: ${input.company}`
    : "Target company: general";

  const parsedQuestion = await generateGroqJson({
    fallback: fallbackQuestion,
    model: config.GROQ_QUESTION_MODEL,
    schema: questionSchema,
    serviceName: "interviewService",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "You are an expert interview coach. Generate one fresh, concise interview question. Respond ONLY in valid JSON with no markdown or extra text."
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

Question rules:
- One sentence only.
- Around ${MAX_QUESTION_WORDS} words maximum.
- Ask one clear thing.
- Do not ask multi-part questions unless difficulty is hard.
- Keep the wording mobile-friendly and easy to read.

Return strict JSON:
{
  "question": "one concise question"
}`
      }
    ]
  });

  const normalizedQuestion = normalizeQuestion(parsedQuestion.question);
  const previous = new Set((input.previousQuestions || []).map(normalizeText));

  if (
    previous.has(normalizeText(normalizedQuestion)) ||
    !isQuestionConciseEnough(normalizedQuestion, input.difficulty)
  ) {
    return fallbackQuestion;
  }

  return {
    question: normalizedQuestion
  };
};
