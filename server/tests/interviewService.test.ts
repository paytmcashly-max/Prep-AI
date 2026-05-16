import { beforeEach, describe, expect, it, vi } from "vitest";

const generateGroqJsonMock = vi.fn();

vi.mock("../src/services/groqJsonService.js", () => ({
  generateGroqJson: generateGroqJsonMock
}));

describe("interviewService", () => {
  beforeEach(() => {
    generateGroqJsonMock.mockReset();
  });

  it("returns the normalized AI-generated question when valid", async () => {
    const { generateInterviewQuestion } = await import("../src/services/interviewService.js");

    generateGroqJsonMock.mockResolvedValueOnce({
      question:
        '  "How would you explain a frontend architecture tradeoff to a non-technical stakeholder?"  '
    });

    await expect(
      generateInterviewQuestion({
        category: "Technical",
        difficulty: "medium",
        jobRole: "Frontend Developer",
        previousQuestions: []
      })
    ).resolves.toEqual({
      question:
        "How would you explain a frontend architecture tradeoff to a non-technical stakeholder?"
    });
  });

  it("retries when the AI returns a repeated question", async () => {
    const { generateInterviewQuestion } = await import("../src/services/interviewService.js");

    generateGroqJsonMock
      .mockResolvedValueOnce({
        question: "Tell me about a time you led a difficult project."
      })
      .mockResolvedValueOnce({
        question: "Describe a time you aligned a team around a tough technical decision."
      });

    await expect(
      generateInterviewQuestion({
        category: "Behavioral",
        difficulty: "medium",
        jobRole: "Engineering Manager",
        previousQuestions: ["Tell me about a time you led a difficult project."]
      })
    ).resolves.toEqual({
      question: "Describe a time you aligned a team around a tough technical decision."
    });

    expect(generateGroqJsonMock).toHaveBeenCalledTimes(2);
  });

  it("fails safely instead of using a hardcoded fallback question", async () => {
    const { generateInterviewQuestion, InterviewGenerationError } =
      await import("../src/services/interviewService.js");

    generateGroqJsonMock.mockResolvedValue({
      question:
        "Tell me about a time you had to explain a difficult decision clearly while managing multiple stakeholders and balancing deadlines across several teams."
    });

    await expect(
      generateInterviewQuestion({
        category: "Behavioral",
        difficulty: "medium",
        jobRole: "Product Manager",
        previousQuestions: []
      })
    ).rejects.toBeInstanceOf(InterviewGenerationError);

    expect(generateGroqJsonMock).toHaveBeenCalledTimes(3);
  });
});
