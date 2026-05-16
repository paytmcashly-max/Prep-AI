import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

const firebasePrivateKey = "test-private-key-value";
const groqApiKey = "test-groq-key-value";

let app: Express;

beforeAll(async () => {
  process.env.FIREBASE_PROJECT_ID = "test-project";
  process.env.FIREBASE_CLIENT_EMAIL = "firebase-adminsdk@test-project.iam.gserviceaccount.com";
  process.env.FIREBASE_PRIVATE_KEY = firebasePrivateKey;
  process.env.GROQ_API_KEY = groqApiKey;

  const appModule = await import("../src/app.js");
  app = appModule.app;
});

describe("backend app", () => {
  it("GET /health returns liveness", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      service: "prepai-server",
      timestamp: expect.any(String)
    });
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });

  it("GET /ready returns safe readiness JSON without secret values", async () => {
    const response = await request(app).get("/ready").expect(200);
    const serializedBody = JSON.stringify(response.body);

    expect(response.body).toEqual({
      ok: true,
      checks: {
        firebase: true,
        groq: true
      }
    });
    expect(serializedBody).not.toContain(firebasePrivateKey);
    expect(serializedBody).not.toContain(groqApiKey);
  });

  it("voice feature middleware returns a safe 404 while disabled", async () => {
    const { default: express } = await import("express");
    const { config } = await import("../src/config.js");
    const { requireVoiceFeatureEnabled } = await import("../src/voiceFeatureMiddleware.js");
    const originalFlag = config.ENABLE_VOICE_FEATURE;
    const voiceApp = express();

    config.ENABLE_VOICE_FEATURE = false;
    voiceApp.get("/api/voice/test", requireVoiceFeatureEnabled, (_request, response) => {
      response.json({ ok: true });
    });

    try {
      const response = await request(voiceApp).get("/api/voice/test").expect(404);

      expect(response.body).toEqual({ error: "Voice feature is not available" });
    } finally {
      config.ENABLE_VOICE_FEATURE = originalFlag;
    }
  });

  it("POST /api/interview without Authorization returns 401", async () => {
    const response = await request(app)
      .post("/api/interview")
      .send({
        category: "HR",
        difficulty: "medium",
        jobRole: "Full Stack Developer"
      })
      .expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("POST /api/interview/start without Authorization returns 401", async () => {
    const response = await request(app).post("/api/interview/start").send({}).expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("POST /api/evaluate without Authorization returns 401", async () => {
    const response = await request(app)
      .post("/api/evaluate")
      .send({
        answer: "I have experience building React Native apps.",
        jobRole: "Full Stack Developer",
        question: "Tell me about yourself."
      })
      .expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("POST /api/resume/analyze without Authorization returns 401", async () => {
    const response = await request(app)
      .post("/api/resume/analyze")
      .send({
        jobRole: "Full Stack Developer",
        resumeText:
          "Experienced developer with frontend, backend, testing, deployment, leadership, and project delivery experience across multiple products."
      })
      .expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("POST /api/resume/analyze PDF upload without Authorization returns 401", async () => {
    const response = await request(app)
      .post("/api/resume/analyze")
      .field("jobRole", "Full Stack Developer")
      .attach("resume", Buffer.from("%PDF-1.4\n% test pdf"), {
        contentType: "application/pdf",
        filename: "resume.pdf"
      })
      .expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("GET /api/usage/status without Authorization returns 401", async () => {
    const response = await request(app).get("/api/usage/status").expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("GET /api/resume/latest without Authorization returns 401", async () => {
    const response = await request(app).get("/api/resume/latest").expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("GET /api/resume/history without Authorization returns 401", async () => {
    const response = await request(app).get("/api/resume/history").expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("GET /api/subscription/status without Authorization returns 401", async () => {
    const response = await request(app).get("/api/subscription/status").expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("POST /api/auth/send-verification-email without Authorization returns 401", async () => {
    const response = await request(app).post("/api/auth/send-verification-email").expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("POST /api/voice/transcribe returns 404 while the feature flag is disabled", async () => {
    const { config } = await import("../src/config.js");
    const originalFlag = config.ENABLE_VOICE_FEATURE;

    config.ENABLE_VOICE_FEATURE = false;

    try {
      const response = await request(app)
        .post("/api/voice/transcribe")
        .attach("audio", Buffer.from("not-real-audio"), {
          contentType: "audio/webm",
          filename: "answer.webm"
        })
        .expect(404);

      expect(response.body).toEqual({ error: "Voice feature is not available" });
    } finally {
      config.ENABLE_VOICE_FEATURE = originalFlag;
    }
  });

  it("POST /api/voice/transcribe without Authorization returns 401 when enabled", async () => {
    const { config } = await import("../src/config.js");
    const originalFlag = config.ENABLE_VOICE_FEATURE;

    config.ENABLE_VOICE_FEATURE = true;

    try {
      const response = await request(app)
        .post("/api/voice/transcribe")
        .attach("audio", Buffer.from("not-real-audio"), {
          contentType: "audio/webm",
          filename: "answer.webm"
        })
        .expect(401);

      expect(response.body).toEqual({ error: "Authentication required." });
    } finally {
      config.ENABLE_VOICE_FEATURE = originalFlag;
    }
  });

  it("POST /api/payments/razorpay/order without Authorization returns 401", async () => {
    const response = await request(app)
      .post("/api/payments/razorpay/order")
      .send({
        plan: "monthly"
      })
      .expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("POST /api/payments/razorpay/verify without Authorization returns 401", async () => {
    const response = await request(app)
      .post("/api/payments/razorpay/verify")
      .send({
        paymentId: "pay_test",
        paymentLinkId: "plink_test",
        paymentLinkReferenceId: "ref_test",
        paymentLinkStatus: "paid",
        signature: "signature"
      })
      .expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("POST /api/payments/razorpay/webhook rejects invalid signatures", async () => {
    const response = await request(app)
      .post("/api/payments/razorpay/webhook")
      .set("x-razorpay-signature", "invalid-signature")
      .send({
        event: "payment_link.paid"
      })
      .expect(400);

    expect(response.body).toEqual({ error: "Invalid webhook signature." });
  });

  it("resume text validation rejects too-short content before analysis", async () => {
    const { normalizeResumeTextForAnalysis, ResumeTextValidationError } =
      await import("../src/services/resumeService.js");

    expect(() => normalizeResumeTextForAnalysis("too short")).toThrow(ResumeTextValidationError);
  });

  it("resume ATS score normalization treats decimals as percentages", async () => {
    const { normalizeAtsScore } = await import("../src/services/resumeService.js");

    expect(normalizeAtsScore(0.4)).toBe(40);
    expect(normalizeAtsScore(85)).toBe(85);
    expect(normalizeAtsScore(130)).toBe(100);
  });

  it("subscription status treats server-verified active premium without expiration as unlimited", async () => {
    const { isSubscriptionActiveFromData } = await import("../src/services/usageService.js");

    expect(
      isSubscriptionActiveFromData({
        isPremium: true,
        verificationStatus: "server_verified"
      })
    ).toBe(true);
    expect(
      isSubscriptionActiveFromData(
        {
          expirationDate: "2099-01-01T00:00:00.000Z",
          isPremium: true,
          verificationStatus: "server_verified"
        },
        new Date("2026-01-01T00:00:00.000Z")
      )
    ).toBe(true);
  });

  it("subscription status rejects expired or inactive premium", async () => {
    const { isSubscriptionActiveFromData } = await import("../src/services/usageService.js");

    expect(
      isSubscriptionActiveFromData(
        {
          expirationDate: "2025-01-01T00:00:00.000Z",
          isPremium: true,
          verificationStatus: "server_verified"
        },
        new Date("2026-01-01T00:00:00.000Z")
      )
    ).toBe(false);
    expect(
      isSubscriptionActiveFromData({
        isPremium: false,
        verificationStatus: "server_verified"
      })
    ).toBe(false);
    expect(
      isSubscriptionActiveFromData({
        isPremium: true,
        verificationStatus: "client_reported_unverified"
      })
    ).toBe(false);
    expect(isSubscriptionActiveFromData({ isPremium: true })).toBe(false);
  });

  it("server verified Razorpay subscription records can grant premium access", async () => {
    const { createServerVerifiedSubscriptionRecord } =
      await import("../src/services/subscriptionService.js");

    const record = createServerVerifiedSubscriptionRecord({
      expirationDate: "2099-01-01T00:00:00.000Z",
      orderId: "plink_test",
      paymentId: "pay_test",
      plan: "monthly"
    });

    expect(record).toMatchObject({
      isPremium: true,
      provider: "razorpay",
      source: "razorpay",
      verificationStatus: "server_verified"
    });
  });

  it("Razorpay reports payments unavailable when backend env is missing", async () => {
    const { config } = await import("../src/config.js");
    const { getRazorpayPaymentStatus } = await import("../src/services/razorpayService.js");
    const originalConfig = {
      RAZORPAY_KEY_ID: config.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: config.RAZORPAY_KEY_SECRET,
      RAZORPAY_PREMIUM_MONTHLY_AMOUNT: config.RAZORPAY_PREMIUM_MONTHLY_AMOUNT,
      RAZORPAY_PREMIUM_YEARLY_AMOUNT: config.RAZORPAY_PREMIUM_YEARLY_AMOUNT
    };

    config.RAZORPAY_KEY_ID = undefined;
    config.RAZORPAY_KEY_SECRET = undefined;
    config.RAZORPAY_PREMIUM_MONTHLY_AMOUNT = undefined;
    config.RAZORPAY_PREMIUM_YEARLY_AMOUNT = undefined;

    try {
      expect(getRazorpayPaymentStatus()).toMatchObject({
        paymentAvailable: false,
        plans: [],
        provider: "razorpay"
      });
    } finally {
      config.RAZORPAY_KEY_ID = originalConfig.RAZORPAY_KEY_ID;
      config.RAZORPAY_KEY_SECRET = originalConfig.RAZORPAY_KEY_SECRET;
      config.RAZORPAY_PREMIUM_MONTHLY_AMOUNT = originalConfig.RAZORPAY_PREMIUM_MONTHLY_AMOUNT;
      config.RAZORPAY_PREMIUM_YEARLY_AMOUNT = originalConfig.RAZORPAY_PREMIUM_YEARLY_AMOUNT;
    }
  });

  it("Razorpay order creation fails safely when backend env is missing", async () => {
    const { config } = await import("../src/config.js");
    const { createRazorpayPaymentLink, RazorpayUnavailableError } =
      await import("../src/services/razorpayService.js");
    const originalConfig = {
      RAZORPAY_KEY_ID: config.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: config.RAZORPAY_KEY_SECRET,
      RAZORPAY_PREMIUM_MONTHLY_AMOUNT: config.RAZORPAY_PREMIUM_MONTHLY_AMOUNT
    };

    config.RAZORPAY_KEY_ID = undefined;
    config.RAZORPAY_KEY_SECRET = undefined;
    config.RAZORPAY_PREMIUM_MONTHLY_AMOUNT = undefined;

    try {
      await expect(
        createRazorpayPaymentLink({
          plan: "monthly",
          uid: "test-user"
        })
      ).rejects.toBeInstanceOf(RazorpayUnavailableError);
    } finally {
      config.RAZORPAY_KEY_ID = originalConfig.RAZORPAY_KEY_ID;
      config.RAZORPAY_KEY_SECRET = originalConfig.RAZORPAY_KEY_SECRET;
      config.RAZORPAY_PREMIUM_MONTHLY_AMOUNT = originalConfig.RAZORPAY_PREMIUM_MONTHLY_AMOUNT;
    }
  });

  it("daily usage period resets at India midnight", async () => {
    const { getDailyPeriodKey, getDailyResetAt } = await import("../src/services/usageService.js");

    expect(getDailyPeriodKey(new Date("2026-05-08T18:29:59.000Z"))).toBe("2026-05-08");
    expect(getDailyPeriodKey(new Date("2026-05-08T18:30:00.000Z"))).toBe("2026-05-09");
    expect(getDailyResetAt(new Date("2026-05-08T18:29:59.000Z"))).toBe("2026-05-08T18:30:00.000Z");
  });

  it("resume usage cooldown lasts 3 days after the last scan", async () => {
    const { getResumeCooldownResetAt } = await import("../src/services/usageService.js");

    expect(
      getResumeCooldownResetAt("2026-05-09T10:00:00.000Z", new Date("2026-05-09T10:01:00.000Z"))
    ).toBe("2026-05-12T10:00:00.000Z");
    expect(getResumeCooldownResetAt(undefined, new Date("2026-05-09T10:00:00.000Z"))).toBe(
      "2026-05-09T10:00:00.000Z"
    );
  });

  it("verification email service fails safely when Resend env is missing", async () => {
    const { config } = await import("../src/config.js");
    const { VerificationEmailUnavailableError, sendVerificationEmail } =
      await import("../src/services/verificationEmailService.js");
    const originalConfig = {
      EMAIL_FROM: config.EMAIL_FROM,
      RESEND_API_KEY: config.RESEND_API_KEY
    };

    config.RESEND_API_KEY = undefined;
    config.EMAIL_FROM = undefined;

    try {
      await expect(
        sendVerificationEmail({
          email: "qa@example.com",
          uid: "test-user"
        })
      ).rejects.toBeInstanceOf(VerificationEmailUnavailableError);
    } finally {
      config.RESEND_API_KEY = originalConfig.RESEND_API_KEY;
      config.EMAIL_FROM = originalConfig.EMAIL_FROM;
    }
  });

  it("verification email links can be rewritten to the branded verify page", async () => {
    const { createCustomVerificationUrl } =
      await import("../src/services/verificationEmailService.js");

    expect(
      createCustomVerificationUrl(
        "https://prepai-c27cb.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=test-code-123&lang=en",
        "https://intervueai.tech"
      )
    ).toBe("https://intervueai.tech/verify-email?mode=verifyEmail&oobCode=test-code-123&lang=en");
  });
});
