import { doc, getDoc } from "firebase/firestore";

import { auth, firestore } from "./firebaseConfig";
import { ApiClientError, postAuthenticatedFormData, postAuthenticatedJson } from "./apiClient";
import { useUserStore } from "../store/userStore";

const DEFAULT_CATEGORY = "HR";
const DEFAULT_DIFFICULTY = "easy";
const DEFAULT_JOB_ROLE = "Software Developer";
const LOCAL_DAILY_TIP =
  "Start with brief context, then give a specific example. Keep your answer structured and tied to the role.";

const callInterviewApi = async (body) => {
  const payload = await postAuthenticatedJson("/api/interview", body, {
    badRequestMessage: "Please complete your profile before starting an interview.",
    usageLimitMessage:
      "You have used your free interview questions for today. Please try again tomorrow."
  });

  if (typeof payload?.question !== "string" || !payload.question.trim()) {
    throw new ApiClientError(
      "Invalid response from server. Please try again.",
      0,
      "INVALID_RESPONSE"
    );
  }

  return payload.question.trim();
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
      company: category.company,
      jobRole: category.jobRole,
      difficulty: category.difficulty
    };
  }

  return {
    category,
    jobRole,
    difficulty: difficulty || DEFAULT_DIFFICULTY
  };
};

const normalizeRequiredString = (value, fallback) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback;
};

const createInterviewRequestBody = ({ category, company, difficulty, jobRole }) => {
  const body = {
    category: normalizeRequiredString(category, DEFAULT_CATEGORY),
    difficulty: normalizeRequiredString(difficulty, DEFAULT_DIFFICULTY),
    jobRole: normalizeRequiredString(jobRole, DEFAULT_JOB_ROLE)
  };

  const normalizedCompany = typeof company === "string" ? company.trim() : "";

  if (normalizedCompany) {
    body.company = normalizedCompany;
  }

  return body;
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

const normalizeEvaluationFeedback = (feedback) => {
  if (!feedback || typeof feedback !== "object") {
    throw new ApiClientError(
      "Invalid response from server. Please try again.",
      0,
      "INVALID_RESPONSE"
    );
  }

  const parsedScore = parseFloat(String(feedback?.score ?? "0").replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(parsedScore)) {
    throw new ApiClientError(
      "Invalid response from server. Please try again.",
      0,
      "INVALID_RESPONSE"
    );
  }

  if (
    !Array.isArray(feedback.strengths) ||
    !Array.isArray(feedback.improvements) ||
    typeof feedback.idealAnswer !== "string"
  ) {
    throw new ApiClientError(
      "Invalid response from server. Please try again.",
      0,
      "INVALID_RESPONSE"
    );
  }

  return {
    score: Math.max(0, Math.min(10, parsedScore)),
    strengths: feedback.strengths,
    improvements: feedback.improvements,
    idealAnswer: feedback.idealAnswer
  };
};

const normalizeResumeAnalysis = (analysis) => {
  if (!analysis || typeof analysis !== "object") {
    throw new ApiClientError(
      "Invalid response from server. Please try again.",
      0,
      "INVALID_RESPONSE"
    );
  }

  const parsedScore = parseFloat(String(analysis?.atsScore ?? "0").replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(parsedScore)) {
    throw new ApiClientError(
      "Invalid response from server. Please try again.",
      0,
      "INVALID_RESPONSE"
    );
  }

  if (
    !Array.isArray(analysis.missingKeywords) ||
    !Array.isArray(analysis.grammarIssues) ||
    typeof analysis.sectionFeedback?.summary !== "string" ||
    typeof analysis.sectionFeedback?.experience !== "string" ||
    typeof analysis.sectionFeedback?.skills !== "string" ||
    typeof analysis.sectionFeedback?.education !== "string"
  ) {
    throw new ApiClientError(
      "Invalid response from server. Please try again.",
      0,
      "INVALID_RESPONSE"
    );
  }

  return {
    atsScore: parsedScore,
    missingKeywords: analysis.missingKeywords,
    grammarIssues: analysis.grammarIssues,
    sectionFeedback: {
      summary: analysis.sectionFeedback.summary,
      experience: analysis.sectionFeedback.experience,
      skills: analysis.sectionFeedback.skills,
      education: analysis.sectionFeedback.education
    }
  };
};

export const generateQuestion = async (category, jobRole, difficulty = DEFAULT_DIFFICULTY) => {
  const args = normalizeQuestionArgs(category, jobRole, difficulty);
  const resolvedJobRole = await resolveJobRole(args.jobRole);

  return callInterviewApi(
    createInterviewRequestBody({
      category: args.category,
      company: args.company,
      difficulty: args.difficulty,
      jobRole: resolvedJobRole
    })
  );
};

export const evaluateAnswer = async (question, answer, jobRole) => {
  const args = normalizeEvaluationArgs(question, answer, jobRole);
  const resolvedJobRole = await resolveJobRole(args.jobRole);
  const feedback = await postAuthenticatedJson(
    "/api/evaluate",
    {
      answer: args.answer,
      jobRole: resolvedJobRole,
      question: args.question
    },
    {
      usageLimitMessage:
        "You have used your free answer evaluations for today. Please try again tomorrow."
    }
  );

  return normalizeEvaluationFeedback(feedback);
};

export const generateDailyTip = async () => LOCAL_DAILY_TIP;

export const analyzeResume = async (resumeText, jobRole) => {
  const args = normalizeResumeArgs(resumeText, jobRole);
  const resolvedJobRole = await resolveJobRole(args.jobRole);
  const analysis = await postAuthenticatedJson(
    "/api/resume/analyze",
    {
      jobRole: resolvedJobRole,
      resumeText: String(args.resumeText || "").substring(0, 12000)
    },
    {
      usageLimitMessage: "You have used your free resume analysis for this month."
    }
  );

  return normalizeResumeAnalysis(analysis);
};

export const analyzeResumePdf = async (asset, jobRole) => {
  const resolvedJobRole = await resolveJobRole(jobRole);

  if (!asset?.uri) {
    throw new ApiClientError("Please upload a PDF resume.", 400, "MISSING_RESUME_FILE");
  }

  const formData = new FormData();

  formData.append("jobRole", resolvedJobRole);
  formData.append("resume", {
    uri: asset.uri,
    type: "application/pdf",
    name: asset.name || "resume.pdf"
  });

  const analysis = await postAuthenticatedFormData("/api/resume/analyze", formData, {
    logBody: {
      hasResumeFile: true,
      jobRole: resolvedJobRole
    },
    usageLimitMessage: "You have used your free resume analysis for this month."
  });

  return normalizeResumeAnalysis(analysis);
};

export const generateInterviewQuestion = generateQuestion;
