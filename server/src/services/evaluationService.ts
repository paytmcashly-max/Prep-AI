import { z } from "zod";

import { config } from "../config.js";
import { generateGroqJson } from "./groqJsonService.js";

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
  improvements: [
    "Add a specific example with your role, action, and measurable result.",
    "Rewrite one line as: In my last project, I built X using Y, which improved Z by N%."
  ],
  idealAnswer:
    "A strong answer should start with brief context, explain your specific contribution, include a measurable result, and connect the example to the target role."
};

const evaluationSchema = z.object({
  score: z.number().min(0).max(10),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  idealAnswer: z.string()
});

const truncateWords = (value: string, maxWords: number) => {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) {
    return value.trim();
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
};

const truncateCharacters = (value: string, maxCharacters: number) => {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxCharacters) {
    return normalized;
  }

  return `${normalized.slice(0, maxCharacters - 3).trim()}...`;
};

const normalizeEvaluation = (evaluation: InterviewEvaluation): InterviewEvaluation => ({
  score: Math.max(0, Math.min(10, Number(evaluation.score || 0))),
  strengths: evaluation.strengths.slice(0, 3).map((strength) => truncateCharacters(strength, 160)),
  improvements: evaluation.improvements
    .slice(0, 3)
    .map((improvement) => truncateCharacters(improvement, 180)),
  idealAnswer: truncateWords(evaluation.idealAnswer, 160)
});

export const evaluateInterviewAnswer = async (
  input: EvaluateInterviewAnswerInput
): Promise<InterviewEvaluation> => {
  const evaluation = await generateGroqJson({
    fallback: fallbackEvaluation,
    model: config.GROQ_EVALUATION_MODEL,
    schema: evaluationSchema,
    serviceName: "evaluationService",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a strict but helpful interview coach. Score realistically and give specific coaching. Respond ONLY in valid JSON with no markdown or extra text."
      },
      {
        role: "user",
        content: `Evaluate this interview answer for a ${input.jobRole} candidate.

Question:
${input.question}

Candidate answer:
${input.answer}

Scoring rubric:
- 0-2: empty, vague, unrelated, or no concrete example.
- 3-5: relevant but generic, missing structure or evidence.
- 6-8: clear, role-relevant, structured, with some specific examples.
- 9-10: concise, highly specific, measurable impact, and strong role fit.

Make every improvement actionable. Include concrete rewrite examples the candidate can copy or adapt. Do not be overly generous.
Keep feedback concise:
- strengths: maximum 3 short bullets.
- improvements: maximum 3 short, actionable bullets.
- idealAnswer: useful but compact, around 120-160 words maximum.

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

  return normalizeEvaluation(evaluation);
};
