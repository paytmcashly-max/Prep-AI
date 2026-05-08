import Groq from "groq-sdk";
import { PDFParse } from "pdf-parse";
import { z } from "zod";

import { config } from "../config.js";
import { logger } from "../logger.js";

export type AnalyzeResumeInput = {
  resumeText: string;
  jobRole: string;
};

export type ResumeAnalysis = {
  atsScore: number;
  missingKeywords: string[];
  grammarIssues: string[];
  sectionFeedback: {
    summary: string;
    experience: string;
    skills: string;
    education: string;
  };
};

export class ResumeTextValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeTextValidationError";
  }
}

export const MIN_RESUME_TEXT_LENGTH = 100;
export const MAX_RESUME_TEXT_LENGTH = 12000;

const fallbackResumeAnalysis: ResumeAnalysis = {
  atsScore: 50,
  missingKeywords: [],
  grammarIssues: [],
  sectionFeedback: {
    summary: "Add a concise summary tailored to the target role.",
    experience: "Use measurable achievements and action verbs.",
    skills: "Include role-specific technical and soft skills.",
    education: "Keep education clear and relevant."
  }
};

const resumeAnalysisSchema = z
  .object({
    atsScore: z.number().min(0).max(100),
    missingKeywords: z.array(z.string()),
    grammarIssues: z.array(z.string()),
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
  const apiKey = config.GROQ_API_KEY;
  const resumeText = normalizeResumeTextForAnalysis(input.resumeText);

  if (!apiKey) {
    return fallbackResumeAnalysis;
  }

  const groq = new Groq({ apiKey });
  const model = config.GROQ_RESUME_MODEL;

  try {
    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume reviewer and ATS optimization coach. Respond ONLY in valid JSON with no markdown or extra text."
        },
        {
          role: "user",
          content: `Analyze this resume for a ${input.jobRole} position.

Resume text:
${resumeText}

Return strict JSON in this exact shape:
{
  "atsScore": number,
  "missingKeywords": string[],
  "grammarIssues": string[],
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

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      logger.warn("Groq resume analysis returned empty response", {
        service: "resumeService"
      });
      return fallbackResumeAnalysis;
    }

    return resumeAnalysisSchema.parse(JSON.parse(content));
  } catch (error) {
    logger.error("Groq resume analysis failed safely", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorName: error instanceof Error ? error.name : "UnknownError",
      service: "resumeService"
    });

    return fallbackResumeAnalysis;
  }
};
