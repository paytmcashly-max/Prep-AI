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
  rewriteSuggestions?: string[];
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
  rewriteSuggestions: [
    "Add: Built and maintained a production feature using relevant tools, improving user or business outcomes by a measurable amount."
  ],
  sectionFeedback: {
    summary: "Add a concise summary tailored to the target role.",
    experience: "Use measurable achievements and action verbs.",
    skills: "Include role-specific technical and soft skills.",
    education: "Keep education clear and relevant."
  }
};

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
            "You are an expert resume reviewer and ATS optimization coach. Give concrete, role-specific resume improvements. Respond ONLY in valid JSON with no markdown or extra text."
        },
        {
          role: "user",
          content: `Analyze this resume for a ${input.jobRole} position.

Resume text:
${resumeText}

The atsScore must be a number from 0 to 100, not 0 to 1.
In rewriteSuggestions, provide 3-5 concrete resume lines the candidate can add or adapt. Each line should start with "Add:" and be specific to the target role, for example "Add: Built X using Y, improving Z by N%." Do not invent impossible claims; use placeholders like [metric] only when the resume lacks numbers.

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

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      logger.warn("Groq resume analysis returned empty response", {
        service: "resumeService"
      });
      return fallbackResumeAnalysis;
    }

    const parsedAnalysis = resumeAnalysisSchema.parse(JSON.parse(content));

    return {
      ...parsedAnalysis,
      atsScore: normalizeAtsScore(parsedAnalysis.atsScore)
    };
  } catch (error) {
    logger.error("Groq resume analysis failed safely", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorName: error instanceof Error ? error.name : "UnknownError",
      service: "resumeService"
    });

    return fallbackResumeAnalysis;
  }
};
