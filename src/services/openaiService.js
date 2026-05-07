import Groq from "groq-sdk";
import Constants from "expo-constants";
import { doc, getDoc } from "firebase/firestore";

import { auth, firestore } from "./firebaseConfig";
import { useUserStore } from "../store/userStore";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_JOB_ROLE = "Full Stack Developer";
const GROQ_TIMEOUT_MS = 10000;

let groqClient;

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY || Constants.expoConfig?.extra?.groqApiKey;

  if (!apiKey || apiKey === "your_key_here") {
    throw new Error("Missing GROQ_API_KEY. Add your Groq key to .env.");
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  return groqClient;
};

const getMessageContent = (completion) => {
  const content = completion.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  return content;
};

const createChatCompletion = async ({
  messages,
  temperature = 0.5,
  maxTokens = 900,
  responseFormat
}) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Request timed out. Try again."));
    }, GROQ_TIMEOUT_MS);
  });

  try {
    const completion = await Promise.race([
      getGroqClient().chat.completions.create({
        model: GROQ_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat ? { response_format: responseFormat } : {})
      }),
      timeoutPromise
    ]);

    return getMessageContent(completion);
  } finally {
    clearTimeout(timeoutId);
  }
};

const parseJsonResponse = (content) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(content.slice(jsonStart, jsonEnd + 1));
    }

    throw error;
  }
};

const normalizeResumeAnalysis = (analysis) => {
  const parsedScore = parseFloat(String(analysis.atsScore ?? "0").replace(/[^0-9.]/g, ""));

  return {
    atsScore: Number.isFinite(parsedScore) ? parsedScore : 0,
    missingKeywords: Array.isArray(analysis.missingKeywords) ? analysis.missingKeywords : [],
    grammarIssues: Array.isArray(analysis.grammarIssues) ? analysis.grammarIssues : [],
    sectionFeedback: {
      summary: analysis.sectionFeedback?.summary || "",
      experience: analysis.sectionFeedback?.experience || "",
      skills: analysis.sectionFeedback?.skills || "",
      education: analysis.sectionFeedback?.education || ""
    }
  };
};

const normalizeEvaluationFeedback = (feedback) => {
  const parsedScore = parseFloat(String(feedback.score ?? "0").replace(/[^0-9.]/g, ""));

  return {
    score: Number.isFinite(parsedScore) ? Math.max(0, Math.min(10, parsedScore)) : 0,
    strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
    improvements: Array.isArray(feedback.improvements) ? feedback.improvements : [],
    idealAnswer: feedback.idealAnswer || ""
  };
};

const normalizeProfile = (profile, fallbackName = "") => ({
  name: profile.fullName || profile.name || fallbackName,
  fullName: profile.fullName || profile.name || fallbackName,
  jobRole: profile.jobRole || "",
  experienceLevel: profile.experienceLevel || "",
  targetCompanies: profile.targetCompanies || []
});

const fetchProfileFromFirestore = async () => {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const profileRef = doc(firestore, "users", user.uid, "profile", "main");
  const profileSnapshot = await getDoc(profileRef);

  if (profileSnapshot.exists()) {
    return normalizeProfile(profileSnapshot.data(), user.displayName || "");
  }

  const userSnapshot = await getDoc(doc(firestore, "users", user.uid));

  if (userSnapshot.exists()) {
    return normalizeProfile(userSnapshot.data(), user.displayName || "");
  }

  return null;
};

const resolveJobRole = async (jobRole) => {
  const explicitRole = typeof jobRole === "string" ? jobRole.trim() : "";

  if (explicitRole) {
    return explicitRole;
  }

  const cachedProfile = useUserStore.getState().profile;
  const cachedRole = cachedProfile.jobRole?.trim();

  if (cachedRole) {
    return cachedRole;
  }

  try {
    const firestoreProfile = await fetchProfileFromFirestore();
    const firestoreRole = firestoreProfile?.jobRole?.trim();

    if (firestoreProfile) {
      useUserStore.getState().updateProfile(firestoreProfile);
    }

    return firestoreRole || DEFAULT_JOB_ROLE;
  } catch (error) {
    console.warn("Could not fetch profile job role:", error);
    return DEFAULT_JOB_ROLE;
  }
};

const normalizeQuestionArgs = (category, jobRole, difficulty) => {
  if (typeof category === "object" && category !== null) {
    return {
      category: category.category,
      jobRole: category.jobRole,
      difficulty: category.difficulty || "medium"
    };
  }

  return {
    category,
    jobRole,
    difficulty: difficulty || "medium"
  };
};

const normalizeEvaluationArgs = (question, answer, jobRole) => {
  if (typeof question === "object" && question !== null) {
    return {
      question: question.question,
      answer: question.answer,
      jobRole: question.jobRole
    };
  }

  return { question, answer, jobRole };
};

const normalizeResumeArgs = (resumeText, jobRole) => {
  if (typeof resumeText === "object" && resumeText !== null) {
    return {
      resumeText: resumeText.resumeText,
      jobRole: resumeText.jobRole
    };
  }

  return { resumeText, jobRole };
};

export const generateQuestion = async (category, jobRole, difficulty = "medium") => {
  try {
    const args = normalizeQuestionArgs(category, jobRole, difficulty);
    const resolvedJobRole = await resolveJobRole(args.jobRole);
    const prompt = `
Generate one ${args.difficulty} interview question for a ${resolvedJobRole} candidate.
Category: ${args.category}
Return ONLY the question string, no numbering, no explanation.
`;

    return await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 120
    });
  } catch (error) {
    console.error("generateQuestion failed:", error);
    throw error;
  }
};

export const evaluateAnswer = async (question, answer, jobRole) => {
  try {
    const args = normalizeEvaluationArgs(question, answer, jobRole);
    const resolvedJobRole = await resolveJobRole(args.jobRole);
    const prompt = `
You are an expert ${resolvedJobRole} interviewer.
Evaluate this interview answer.

Question: ${args.question}
Candidate's Answer: ${args.answer}

Respond ONLY in valid JSON, no extra text:
{
  "score": 7,
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "improvements": ["Specific improvement 1", "Specific improvement 2"],
  "idealAnswer": "An ideal answer in 3-4 sentences."
}
`;

    const content = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      maxTokens: 900,
      responseFormat: { type: "json_object" }
    });

    return normalizeEvaluationFeedback(parseJsonResponse(content));
  } catch (error) {
    console.error("evaluateAnswer failed:", error);
    throw error;
  }
};

export const generateDailyTip = async (jobRole) => {
  try {
    const role = typeof jobRole === "object" && jobRole !== null ? jobRole.jobRole : jobRole;
    const resolvedJobRole = await resolveJobRole(role);
    const prompt = `
Give ONE actionable interview tip for a ${resolvedJobRole} candidate in exactly 2 sentences.
Make it specific, practical, and motivating.
Return only the tip.
`;

    return await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 120
    });
  } catch (error) {
    console.error("generateDailyTip failed:", error);
    throw error;
  }
};

export const analyzeResume = async (resumeText, jobRole) => {
  try {
    const args = normalizeResumeArgs(resumeText, jobRole);
    const resolvedJobRole = await resolveJobRole(args.jobRole);
    const safeText = String(args.resumeText || "").substring(0, 3000);
    const prompt = `
Analyze this resume for a ${resolvedJobRole} position.

Resume:
${safeText}

Respond ONLY in valid JSON, no extra text:
{
  "atsScore": 82,
  "missingKeywords": ["keyword1", "keyword2"],
  "grammarIssues": ["issue1", "issue2"],
  "sectionFeedback": {
    "summary": "Feedback for summary section.",
    "experience": "Feedback for experience section.",
    "skills": "Feedback for skills section.",
    "education": "Feedback for education section."
  }
}
`;

    const content = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      maxTokens: 1400,
      responseFormat: { type: "json_object" }
    });

    console.log("Groq analyzeResume response:", content);

    return normalizeResumeAnalysis(parseJsonResponse(content));
  } catch (error) {
    console.error("analyzeResume failed:", error);
    throw error;
  }
};

export const generateInterviewQuestion = generateQuestion;
