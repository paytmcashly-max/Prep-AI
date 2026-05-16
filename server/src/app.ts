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
import voiceRouter from "./routes/voiceRoutes.js";
import { evaluateInterviewAnswer } from "./services/evaluationService.js";
import {
  generateInterviewQuestion,
  InterviewGenerationError
} from "./services/interviewService.js";
import {
  analyzeResume,
  extractTextFromPdfBuffer,
  MAX_RESUME_TEXT_LENGTH,
  MIN_RESUME_TEXT_LENGTH,
  ResumeTextValidationError
} from "./services/resumeService.js";
import {
  trackAnswerEvaluationUsage,
  trackInterviewAttemptUsage,
  trackResumeAnalysisUsage,
  getUsageStatus,
  UsageLimitError
} from "./services/usageService.js";
import {
  createRazorpayPaymentLink,
  getLatestRazorpayPaymentForUser,
  getRazorpayPaymentStatus,
  handleRazorpayWebhook,
  RazorpayUnavailableError,
  RazorpayVerificationError,
  verifyRazorpayPayment,
  verifyRazorpayWebhookSignature
} from "./services/razorpayService.js";
import { getUserSubscriptionStatus } from "./services/subscriptionService.js";
import {
  sendVerificationEmail,
  VerificationEmailUnavailableError
} from "./services/verificationEmailService.js";

export const app = express();

// TODO(voice): Register future `/api/voice/*` routes with `requireVoiceFeatureEnabled`
// so disabled environments stay dark and keep existing app behavior unchanged.

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

const razorpayOrderRequestSchema = z.object({
  plan: z.enum(["monthly", "yearly"])
});

const razorpayVerifyRequestSchema = z.object({
  paymentId: z.string().trim().min(1).max(120),
  paymentLinkId: z.string().trim().min(1).max(120),
  paymentLinkReferenceId: z.string().trim().min(1).max(120),
  paymentLinkStatus: z.string().trim().min(1).max(40),
  signature: z.string().trim().min(1).max(500)
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
  const historyLimit = (await getUserSubscriptionStatus(uid)).isPremium ? 5 : 1;
  const resumeAnalysesCollection = firebaseAdmin
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("resumeAnalyses");

  await resumeAnalysesCollection.add({
    atsScore: analysis.atsScore,
    createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    grammarIssues: analysis.grammarIssues,
    jobRole,
    missingKeywords: analysis.missingKeywords,
    rewriteSuggestions: analysis.rewriteSuggestions || [],
    sectionFeedback: analysis.sectionFeedback
  });

  const historySnapshot = await resumeAnalysesCollection.orderBy("createdAt", "desc").get();
  const staleDocs = historySnapshot.docs.slice(historyLimit);

  if (staleDocs.length) {
    const batch = firebaseAdmin.firestore().batch();

    staleDocs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
};

const mapResumeAnalysisDoc = (doc: { id: string; data: () => Record<string, unknown> }) => {
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

const getResumeAnalysisHistory = async (uid: string, limit: number) => {
  const snapshot = await getFirebaseAdmin()
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("resumeAnalyses")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(mapResumeAnalysisDoc);
};

const getLatestResumeAnalysis = async (uid: string) =>
  (await getResumeAnalysisHistory(uid, 1))[0] || null;

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
app.use(
  express.json({
    limit: "1mb",
    verify: (request, _response, buffer) => {
      (request as Request & { rawBody?: string }).rawBody = buffer.toString("utf8");
    }
  })
);

app.get("/health", (_request, response) => {
  response.status(200).json({
    ok: true,
    service: "prepai-server",
    timestamp: new Date().toISOString()
  });
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

app.post(
  "/api/interview/start",
  requireFirebaseAuth,
  interviewRateLimit,
  async (request, response, next) => {
    try {
      const input = interviewRequestSchema.parse(request.body);
      const question = await generateInterviewQuestion(input);

      await trackInterviewAttemptUsage(getAuthenticatedUid(request));
      response.json(question);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/resume/latest", requireFirebaseAuth, async (request, response, next) => {
  try {
    response.json(await getLatestResumeAnalysis(getAuthenticatedUid(request)));
  } catch (error) {
    next(error);
  }
});

app.get("/api/resume/history", requireFirebaseAuth, async (request, response, next) => {
  try {
    const uid = getAuthenticatedUid(request);
    const subscription = await getUserSubscriptionStatus(uid);

    response.json(await getResumeAnalysisHistory(uid, subscription.isPremium ? 5 : 1));
  } catch (error) {
    next(error);
  }
});

app.get("/api/subscription/status", requireFirebaseAuth, async (request, response, next) => {
  try {
    const uid = getAuthenticatedUid(request);
    const [subscription, paymentStatus, latestPayment] = await Promise.all([
      getUserSubscriptionStatus(uid),
      Promise.resolve(getRazorpayPaymentStatus()),
      getLatestRazorpayPaymentForUser(uid)
    ]);

    response.json({
      ...subscription,
      lastPayment: latestPayment,
      ...paymentStatus
    });
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/auth/send-verification-email",
  requireFirebaseAuth,
  async (request, response, next) => {
    try {
      const user = (request as AuthenticatedRequest).user;

      if (!user?.uid || !user.email) {
        response.status(400).json({
          error: "Email verification is not available for this account."
        });
        return;
      }

      if (user.email_verified) {
        response.json({
          alreadyVerified: true,
          ok: true
        });
        return;
      }

      await sendVerificationEmail({
        displayName: user.name,
        email: user.email,
        uid: user.uid
      });

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

app.use("/api/voice", voiceRouter);

app.post(
  "/api/interview",
  requireFirebaseAuth,
  interviewRateLimit,
  async (request, response, next) => {
    try {
      const input = interviewRequestSchema.parse(request.body);
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

app.post("/api/payments/razorpay/order", requireFirebaseAuth, async (request, response, next) => {
  try {
    const input = razorpayOrderRequestSchema.parse(request.body);
    const uid = getAuthenticatedUid(request);
    const order = await createRazorpayPaymentLink({
      email: (request as AuthenticatedRequest).user?.email,
      plan: input.plan,
      uid
    });

    response.json(order);
  } catch (error) {
    next(error);
  }
});

app.post("/api/payments/razorpay/verify", requireFirebaseAuth, async (request, response, next) => {
  try {
    const input = razorpayVerifyRequestSchema.parse(request.body);
    const subscription = await verifyRazorpayPayment(getAuthenticatedUid(request), input);

    response.json({
      isPremium: subscription.isPremium,
      ok: true,
      provider: "razorpay",
      verificationStatus: subscription.verificationStatus
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/payments/razorpay/webhook", async (request, response, next) => {
  try {
    const rawBody = (request as Request & { rawBody?: string }).rawBody || "";
    const signature = request.header("x-razorpay-signature");

    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      response.status(400).json({ error: "Invalid webhook signature." });
      return;
    }

    const result = await handleRazorpayWebhook(request.body);

    response.json({
      ok: true,
      ...result
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

  if (error instanceof InterviewGenerationError) {
    response.status(503).json({
      error: error.message
    });
    return;
  }

  if (error instanceof RazorpayUnavailableError) {
    response.status(503).json({
      error: "Premium payments are not available in this beta build yet."
    });
    return;
  }

  if (error instanceof RazorpayVerificationError) {
    response.status(400).json({
      error: "Payment verification failed."
    });
    return;
  }

  if (error instanceof VerificationEmailUnavailableError) {
    response.status(503).json({
      error: "We could not send the verification email right now. Please try again in a moment."
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
