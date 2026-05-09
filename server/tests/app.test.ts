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

    expect(response.body).toEqual({ ok: true });
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

  it("POST /api/subscription/sync without Authorization returns 401", async () => {
    const response = await request(app)
      .post("/api/subscription/sync")
      .send({
        activeEntitlements: ["premium"],
        entitlementId: "premium",
        expirationDate: null,
        isPremium: true,
        source: "revenuecat"
      })
      .expect(401);

    expect(response.body).toEqual({ error: "Authentication required." });
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

  it("subscription status treats active premium without expiration as unlimited", async () => {
    const { isSubscriptionActiveFromData } = await import("../src/services/usageService.js");

    expect(isSubscriptionActiveFromData({ isPremium: true })).toBe(true);
    expect(
      isSubscriptionActiveFromData(
        {
          expirationDate: "2099-01-01T00:00:00.000Z",
          isPremium: true
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
          isPremium: true
        },
        new Date("2026-01-01T00:00:00.000Z")
      )
    ).toBe(false);
    expect(isSubscriptionActiveFromData({ isPremium: false })).toBe(false);
  });

  it("client subscription sync records are not authoritative for premium access", async () => {
    const { createUnverifiedSubscriptionRecord } =
      await import("../src/services/subscriptionService.js");

    const record = createUnverifiedSubscriptionRecord({
      activeEntitlements: ["premium"],
      entitlementId: "premium",
      expirationDate: null,
      isPremium: true,
      source: "revenuecat"
    });

    expect(record).toMatchObject({
      clientReportedIsPremium: true,
      isPremium: false,
      verificationStatus: "client_reported_unverified"
    });
  });

  it("daily usage period resets at India midnight", async () => {
    const { getDailyPeriodKey, getDailyResetAt } = await import("../src/services/usageService.js");

    expect(getDailyPeriodKey(new Date("2026-05-08T18:29:59.000Z"))).toBe("2026-05-08");
    expect(getDailyPeriodKey(new Date("2026-05-08T18:30:00.000Z"))).toBe("2026-05-09");
    expect(getDailyResetAt(new Date("2026-05-08T18:29:59.000Z"))).toBe("2026-05-08T18:30:00.000Z");
  });

  it("resume usage period resets every 3 India calendar days", async () => {
    const { getThreeDayResumePeriodKey, getThreeDayResumeResetAt } =
      await import("../src/services/usageService.js");

    expect(getThreeDayResumePeriodKey(new Date("1970-01-01T00:00:00.000Z"))).toBe("1970-01-01");
    expect(getThreeDayResumePeriodKey(new Date("1970-01-03T18:29:59.000Z"))).toBe("1970-01-01");
    expect(getThreeDayResumePeriodKey(new Date("1970-01-03T18:30:00.000Z"))).toBe("1970-01-04");
    expect(getThreeDayResumeResetAt(new Date("1970-01-01T00:00:00.000Z"))).toBe(
      "1970-01-03T18:30:00.000Z"
    );
  });
});
