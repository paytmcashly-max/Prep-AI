import { beforeEach, describe, expect, it, vi } from "vitest";

const generateGroqJsonMock = vi.fn();

vi.mock("../src/services/groqJsonService.js", () => ({
  generateGroqJson: generateGroqJsonMock
}));

describe("resumeService", () => {
  beforeEach(() => {
    generateGroqJsonMock.mockReset();
  });

  it("returns normalized AI-generated resume analysis when valid", async () => {
    const { analyzeResume } = await import("../src/services/resumeService.js");

    generateGroqJsonMock.mockResolvedValueOnce({
      atsScore: 0.82,
      grammarIssues: ["Summary line is too generic."],
      missingKeywords: ["React Native", "TypeScript"],
      rewriteSuggestions: [
        "Add: Built and maintained a React Native feature that improved onboarding conversion by [metric]."
      ],
      sectionFeedback: {
        education: "Keep education concise and role-relevant.",
        experience: "Lead with outcomes and measurable impact.",
        skills: "Add the strongest tools for the target role near the top.",
        summary: "Tailor the summary to the exact job you want next."
      }
    });

    await expect(
      analyzeResume({
        jobRole: "Frontend Developer",
        resumeText:
          "Experienced frontend developer building web and mobile interfaces with React, performance optimization, testing, and product collaboration across multiple shipped products."
      })
    ).resolves.toMatchObject({
      atsScore: 82,
      missingKeywords: ["React Native", "TypeScript"]
    });
  });

  it("fails safely instead of returning a canned fallback analysis", async () => {
    const { analyzeResume, ResumeAnalysisGenerationError } = await import(
      "../src/services/resumeService.js"
    );

    generateGroqJsonMock.mockRejectedValue(new Error("model failed"));

    await expect(
      analyzeResume({
        jobRole: "Product Manager",
        resumeText:
          "Product manager with experience in roadmap planning, stakeholder alignment, delivery coordination, experimentation, and user research across multiple cross-functional launches."
      })
    ).rejects.toBeInstanceOf(ResumeAnalysisGenerationError);

    expect(generateGroqJsonMock).toHaveBeenCalledTimes(3);
  });
});
