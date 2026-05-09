import cors, { type CorsOptions } from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import multer from "multer";
import { ZodError, z } from "zod";

import { type AuthenticatedRequest, requireFirebaseAuth } from "./authMiddleware.js";
import { config } from "./config.js";
import { getFirebaseAdmin } from "./firebaseAdmin.js";
import { logger } from "./logger.js";
import { interviewRateLimit } from "./rateLimitMiddleware.js";
import { evaluateInterviewAnswer } from "./services/evaluationService.js";
import { generateInterviewQuestion } from "./services/interviewService.js";
import {
  analyzeResume,
  extractTextFromPdfBuffer,
  MAX_RESUME_TEXT_LENGTH,
  MIN_RESUME_TEXT_LENGTH,
  ResumeTextValidationError
} from "./services/resumeService.js";
import {
  trackAnswerEvaluationUsage,
  trackInterviewQuestionUsage,
  trackResumeAnalysisUsage,
  getUsageStatus,
  UsageLimitError
} from "./services/usageService.js";
import { createUnverifiedSubscriptionRecord } from "./services/subscriptionService.js";

export const app = express();

const developmentCorsOrigins = [
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:19006",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006"
];

const interviewRequestSchema = z.object({
  jobRole: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  difficulty: z.string().trim().min(1).max(40),
  company: z.string().trim().min(1).max(120).optional(),
  previousQuestions: z.array(z.string().trim().min(1).max(500)).max(10).optional()
});

const evaluationRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  answer: z.string().trim().min(1).max(6000),
  jobRole: z.string().trim().min(1).max(120)
});

const resumeAnalysisRequestSchema = z.object({
  resumeText: z.string().trim().min(MIN_RESUME_TEXT_LENGTH).max(MAX_RESUME_TEXT_LENGTH),
  jobRole: z.string().trim().min(1).max(120)
});

const resumeUploadFieldsSchema = z.object({
  jobRole: z.string().trim().min(1).max(120)
});

const subscriptionSyncRequestSchema = z.object({
  activeEntitlements: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  entitlementId: z.string().trim().min(1).max(120),
  expirationDate: z.string().trim().max(120).nullable().optional(),
  isPremium: z.boolean(),
  source: z.literal("revenuecat")
});

const MAX_RESUME_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

class SafeBadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafeBadRequestError";
  }
}

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_UPLOAD_SIZE_BYTES
  },
  fileFilter: (_request, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      callback(new SafeBadRequestError("Please upload a PDF resume only."));
      return;
    }

    callback(null, true);
  }
});

const getAuthenticatedUid = (request: Request) => {
  const uid = (request as AuthenticatedRequest).user?.uid;

  if (!uid) {
    throw new Error("Authenticated user is missing from request.");
  }

  return uid;
};

const getResumeAnalysisInput = async (request: Request) => {
  if (request.file) {
    const parsedFields = resumeUploadFieldsSchema.safeParse(request.body);

    if (!parsedFields.success) {
      throw new SafeBadRequestError("Please select a target job role.");
    }

    try {
      return {
        jobRole: parsedFields.data.jobRole,
        resumeText: await extractTextFromPdfBuffer(request.file.buffer)
      };
    } catch (error) {
      if (error instanceof ResumeTextValidationError) {
        throw error;
      }

      logger.warn("PDF resume text extraction failed safely", {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorName: error instanceof Error ? error.name : "UnknownError"
      });

      throw new SafeBadRequestError(
        "Could not extract text from this PDF. Please try a text-based PDF or paste your resume text."
      );
    }
  }

  if (request.is("multipart/form-data")) {
    throw new SafeBadRequestError("Please upload a PDF resume.");
  }

  const parsedJson = resumeAnalysisRequestSchema.safeParse(request.body);

  if (!parsedJson.success) {
    throw new SafeBadRequestError(
      "Resume text is too short. Please paste at least 100 characters."
    );
  }

  return parsedJson.data;
};

const serializeFirestoreValue = (value: unknown): unknown => {
  if (value && typeof value === "object" && "toDate" in value) {
    const timestamp = value as { toDate: () => Date };
    return timestamp.toDate().toISOString();
  }

  return value;
};

const saveResumeAnalysis = async ({
  analysis,
  jobRole,
  uid
}: {
  analysis: Awaited<ReturnType<typeof analyzeResume>>;
  jobRole: string;
  uid: string;
}) => {
  const firebaseAdmin = getFirebaseAdmin();

  await firebaseAdmin
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("resumeAnalyses")
    .add({
      atsScore: analysis.atsScore,
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      grammarIssues: analysis.grammarIssues,
      jobRole,
      missingKeywords: analysis.missingKeywords,
      rewriteSuggestions: analysis.rewriteSuggestions || [],
      sectionFeedback: analysis.sectionFeedback
    });
};

const getLatestResumeAnalysis = async (uid: string) => {
  const snapshot = await getFirebaseAdmin()
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("resumeAnalyses")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    atsScore: data.atsScore,
    createdAt: serializeFirestoreValue(data.createdAt),
    grammarIssues: data.grammarIssues || [],
    jobRole: data.jobRole || "",
    missingKeywords: data.missingKeywords || [],
    rewriteSuggestions: data.rewriteSuggestions || [],
    sectionFeedback: data.sectionFeedback || {}
  };
};

const getReadinessChecks = () => {
  const firebase = Boolean(
    config.FIREBASE_PROJECT_ID && config.FIREBASE_CLIENT_EMAIL && config.FIREBASE_PRIVATE_KEY
  );
  const groq = Boolean(config.GROQ_API_KEY);

  return {
    firebase,
    groq
  };
};

const getConfiguredCorsOrigins = () => {
  if (config.CORS_ORIGIN) {
    return config.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  if (config.NODE_ENV === "production") {
    return [];
  }

  return developmentCorsOrigins;
};

const allowedCorsOrigins = getConfiguredCorsOrigins();

const corsOptions: CorsOptions = {
  allowedHeaders: ["Authorization", "Content-Type"],
  methods: ["GET", "POST", "OPTIONS"],
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, allowedCorsOrigins.includes(origin));
  }
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/ready", (_request, response) => {
  const checks = getReadinessChecks();
  const ok = checks.firebase && checks.groq;

  response.status(ok ? 200 : 503).json({
    ok,
    checks
  });
});

app.get("/api/usage/status", requireFirebaseAuth, async (request, response, next) => {
  try {
    response.json(await getUsageStatus(getAuthenticatedUid(request)));
  } catch (error) {
    next(error);
  }
});

app.get("/api/resume/latest", requireFirebaseAuth, async (request, response, next) => {
  try {
    response.json(await getLatestResumeAnalysis(getAuthenticatedUid(request)));
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/interview",
  requireFirebaseAuth,
  interviewRateLimit,
  async (request, response, next) => {
    try {
      const input = interviewRequestSchema.parse(request.body);
      await trackInterviewQuestionUsage(getAuthenticatedUid(request));
      const question = await generateInterviewQuestion(input);

      response.json(question);
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/evaluate",
  requireFirebaseAuth,
  interviewRateLimit,
  async (request, response, next) => {
    try {
      const input = evaluationRequestSchema.parse(request.body);
      await trackAnswerEvaluationUsage(getAuthenticatedUid(request));
      const evaluation = await evaluateInterviewAnswer(input);

      response.json(evaluation);
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/resume/analyze",
  requireFirebaseAuth,
  interviewRateLimit,
  resumeUpload.single("resume"),
  async (request, response, next) => {
    try {
      const input = await getResumeAnalysisInput(request);
      const uid = getAuthenticatedUid(request);
      await trackResumeAnalysisUsage(uid);
      const analysis = await analyzeResume(input);
      await saveResumeAnalysis({
        analysis,
        jobRole: input.jobRole,
        uid
      }).catch((error) => {
        logger.warn("Latest resume analysis could not be saved", {
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          errorName: error instanceof Error ? error.name : "UnknownError"
        });
      });

      response.json(analysis);
    } catch (error) {
      next(error);
    }
  }
);

app.post("/api/subscription/sync", requireFirebaseAuth, async (request, response, next) => {
  try {
    const input = subscriptionSyncRequestSchema.parse(request.body);
    const uid = getAuthenticatedUid(request);
    const firebaseAdmin = getFirebaseAdmin();
    const firestore = firebaseAdmin.firestore();
    const subscriptionRecord = createUnverifiedSubscriptionRecord(input);

    await firestore
      .collection("users")
      .doc(uid)
      .collection("subscription")
      .doc("main")
      .set(
        {
          ...subscriptionRecord,
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

    response.json({
      isPremium: subscriptionRecord.isPremium,
      ok: true
    });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof SafeBadRequestError || error instanceof ResumeTextValidationError) {
    response.status(400).json({
      error: error.message
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "Resume PDF must be 5MB or smaller."
          : "Invalid resume upload."
    });
    return;
  }

  if (error instanceof UsageLimitError) {
    response.status(429).json({
      error: "Usage limit reached"
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: "Invalid interview request."
    });
    return;
  }

  if (error instanceof SyntaxError) {
    response.status(400).json({
      error: "Invalid JSON body."
    });
    return;
  }

  logger.error("Unhandled server error", {
    errorMessage: error instanceof Error ? error.message : "Unknown error",
    errorName: error instanceof Error ? error.name : "UnknownError"
  });
  response.status(500).json({
    error: "Internal server error."
  });
});
