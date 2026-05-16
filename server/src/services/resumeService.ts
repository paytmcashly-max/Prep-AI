import { PDFParse } from "pdf-parse";
import { z } from "zod";

import { config } from "../config.js";
import { generateGroqJson } from "./groqJsonService.js";

export type AnalyzeResumeInput = {
  resumeText: string;
  jobRole: string;
};

export type ResumeAnalysis = {
  atsScore: number;
  missingKeywords: string[];
  grammarIssues: string[];
  rewriteSuggestions?: string[];
  sectionFeedback: {
    summary: string;
    experience: string;
    skills: string;
    education: string;
  };
};

export class ResumeAnalysisGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeAnalysisGenerationError";
  }
}

export class ResumeTextValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeTextValidationError";
  }
}

export const MIN_RESUME_TEXT_LENGTH = 100;
export const MAX_RESUME_TEXT_LENGTH = 12000;

const MAX_GENERATION_ATTEMPTS = 3;

const resumeAnalysisSchema = z
  .object({
    atsScore: z.number(),
    missingKeywords: z.array(z.string()),
    grammarIssues: z.array(z.string()),
    rewriteSuggestions: z.array(z.string()).optional().default([]),
    sectionFeedback: z
      .object({
        summary: z.string(),
        experience: z.string(),
        skills: z.string(),
        education: z.string()
      })
      .strict()
  })
  .strict();

export const normalizeAtsScore = (score: number) => {
  const percentScore = score > 0 && score <= 1 ? score * 100 : score;
  return Math.max(0, Math.min(100, Math.round(percentScore)));
};

export const normalizeResumeTextForAnalysis = (resumeText: string) => {
  const safeText = resumeText.trim();

  if (safeText.length < MIN_RESUME_TEXT_LENGTH) {
    throw new ResumeTextValidationError(
      "Resume text is too short. Please upload a text-based PDF or paste at least 100 characters."
    );
  }

  return safeText.substring(0, MAX_RESUME_TEXT_LENGTH);
};

export const extractTextFromPdfBuffer = async (buffer: Buffer) => {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return normalizeResumeTextForAnalysis(result.text || "");
  } finally {
    await parser.destroy();
  }
};

export const analyzeResume = async (input: AnalyzeResumeInput): Promise<ResumeAnalysis> => {
  const resumeText = normalizeResumeTextForAnalysis(input.resumeText);
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const analysis = await generateGroqJson({
        maxAttempts: 2,
        model: config.GROQ_RESUME_MODEL,
        schema: resumeAnalysisSchema,
        serviceName: "resumeService",
        temperature: 0.15,
        messages: [
          {
            role: "system",
            content: `You are a senior resume reviewer and ATS optimization coach.

Your job is to return a practical, role-specific review for the candidate's resume.
Be honest, specific, and useful. Avoid generic praise and avoid filler.

Rules you must follow:
- Judge the resume for the target role, not for resumes in general.
- Keep every sectionFeedback field concise and directly actionable.
- missingKeywords should contain role-relevant skills, tools, or concepts that are clearly missing or underrepresented.
- grammarIssues should only include real readability or phrasing problems. Do not invent issues when the resume is already clear.
- rewriteSuggestions must contain 3 to 5 realistic lines the candidate can adapt.
- Every rewrite suggestion must start with "Add:".
- Do not invent impossible achievements. If the resume lacks numbers, use placeholders like [metric].
- atsScore must be a number from 0 to 100, not 0 to 1.
- Return strict JSON only with no markdown, bullets outside JSON, or commentary.`
          },
          {
            role: "user",
            content: `Analyze this resume for a ${input.jobRole} position.

Resume text:
${resumeText}

This is attempt ${attempt} of ${MAX_GENERATION_ATTEMPTS}. ${
              attempt === 1
                ? "Start with the strongest possible role-specific review."
                : attempt === 2
                  ? "The previous result was not acceptable. Be more precise, more structured, and make sure the JSON is valid."
                  : "Final retry. Return concise, fully valid JSON with practical feedback only."
            }

Return strict JSON in this exact shape:
{
  "atsScore": number,
  "missingKeywords": string[],
  "grammarIssues": string[],
  "rewriteSuggestions": string[],
  "sectionFeedback": {
    "summary": string,
    "experience": string,
    "skills": string,
    "education": string
  }
}`
          }
        ]
      });

      return {
        ...analysis,
        atsScore: normalizeAtsScore(analysis.atsScore)
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new ResumeAnalysisGenerationError(
    "Could not analyze this resume right now. Please try again."
  );
};
