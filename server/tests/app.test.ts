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

  it("resume text validation rejects too-short content before analysis", async () => {
    const { normalizeResumeTextForAnalysis, ResumeTextValidationError } =
      await import("../src/services/resumeService.js");

    expect(() => normalizeResumeTextForAnalysis("too short")).toThrow(ResumeTextValidationError);
  });
});
