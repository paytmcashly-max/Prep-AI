import { doc, getDoc } from "firebase/firestore";

import { auth, firestore } from "./firebaseConfig";
import { ApiClientError, postAuthenticatedFormData, postAuthenticatedJson } from "./apiClient";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useUserStore } from "../store/userStore";

const DEFAULT_CATEGORY = "HR";
const DEFAULT_DIFFICULTY = "easy";
const DEFAULT_JOB_ROLE = "Software Developer";
const PREMIUM_SYNC_MESSAGE =
  "Premium is active, but your server access has not synced yet. Please refresh or reopen the app.";
const LOCAL_DAILY_TIPS = [
  "Start with brief context, then give a specific example. Keep your answer structured and tied to the role.",
  "For HR answers, use a simple flow: situation, action, result, and what you learned.",
  "Before a technical answer, name the tradeoff you considered. Interviewers notice structured thinking.",
  "For resume bullets, pair your work with a metric: built X, using Y, improving Z by N%.",
  "Keep one strong project story ready. You can adapt it for ownership, teamwork, debugging, and impact questions.",
  "Practice one answer out loud today. Clarity improves faster when you hear your own pacing.",
  "When you do not know an answer, explain your approach instead of guessing. Process matters.",
  "Review the job description before practice and reuse its keywords naturally in your examples."
];

const getTodayDateKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDeterministicTipIndex = (dateKey) =>
  Array.from(dateKey).reduce((sum, char) => sum + char.charCodeAt(0), 0) % LOCAL_DAILY_TIPS.length;

const normalizeAtsScore = (score) => {
  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) {
    return 0;
  }

  const percentScore = numericScore > 0 && numericScore <= 1 ? numericScore * 100 : numericScore;
  return Math.max(0, Math.min(100, Math.round(percentScore)));
};

const getPremiumAwareUsageLimitMessage = (freeLimitMessage) =>
  useSubscriptionStore.getState().isPremium ? PREMIUM_SYNC_MESSAGE : freeLimitMessage;

const callWithPremiumSyncRetry = async (requestFn) => {
  try {
    return await requestFn();
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 429) {
      const wasPremium = useSubscriptionStore.getState().isPremium;

      if (wasPremium) {
        await useSubscriptionStore
          .getState()
          .refreshSubscriptionStatus()
          .catch(() => null);

        if (useSubscriptionStore.getState().isPremium) {
          return requestFn();
        }

        throw new ApiClientError(PREMIUM_SYNC_MESSAGE, 429, error.code);
      }
    }

    throw error;
  }
};

const callInterviewApi = async (body) => {
  const payload = await callWithPremiumSyncRetry(() =>
    postAuthenticatedJson("/api/interview", body, {
      badRequestMessage: "Please complete your profile before starting an interview.",
      rateLimitMessage: "Too many interview requests. Please wait a moment and try again.",
      usageLimitMessage: getPremiumAwareUsageLimitMessage(
        "You have used your free interview questions for today. Please try again tomorrow."
      )
    })
  );

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
      difficulty: category.difficulty,
      previousQuestions: category.previousQuestions
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

const createInterviewRequestBody = ({
  category,
  company,
  difficulty,
  jobRole,
  previousQuestions
}) => {
  const body = {
    category: normalizeRequiredString(category, DEFAULT_CATEGORY),
    difficulty: normalizeRequiredString(difficulty, DEFAULT_DIFFICULTY),
    jobRole: normalizeRequiredString(jobRole, DEFAULT_JOB_ROLE)
  };

  const normalizedCompany = typeof company === "string" ? company.trim() : "";

  if (normalizedCompany) {
    body.company = normalizedCompany;
  }

  if (Array.isArray(previousQuestions)) {
    const safePreviousQuestions = previousQuestions
      .filter((question) => typeof question === "string" && question.trim())
      .map((question) => question.trim())
      .slice(-10);

    if (safePreviousQuestions.length) {
      body.previousQuestions = safePreviousQuestions;
    }
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
    atsScore: normalizeAtsScore(parsedScore),
    missingKeywords: analysis.missingKeywords,
    grammarIssues: analysis.grammarIssues,
    rewriteSuggestions: Array.isArray(analysis.rewriteSuggestions)
      ? analysis.rewriteSuggestions
      : [],
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
      jobRole: resolvedJobRole,
      previousQuestions: args.previousQuestions
    })
  );
};

export const evaluateAnswer = async (question, answer, jobRole) => {
  const args = normalizeEvaluationArgs(question, answer, jobRole);
  const resolvedJobRole = await resolveJobRole(args.jobRole);
  const feedback = await callWithPremiumSyncRetry(() =>
    postAuthenticatedJson(
      "/api/evaluate",
      {
        answer: args.answer,
        jobRole: resolvedJobRole,
        question: args.question
      },
      {
        rateLimitMessage:
          "Too many answer evaluation requests. Please wait a moment and try again.",
        usageLimitMessage: getPremiumAwareUsageLimitMessage(
          "You have used your free answer evaluations for today. Please try again tomorrow."
        )
      }
    )
  );

  return normalizeEvaluationFeedback(feedback);
};

export const generateDailyTip = async () => {
  const dateKey = getTodayDateKey();
  return LOCAL_DAILY_TIPS[getDeterministicTipIndex(dateKey)];
};

export const analyzeResume = async (resumeText, jobRole) => {
  const args = normalizeResumeArgs(resumeText, jobRole);
  const resolvedJobRole = await resolveJobRole(args.jobRole);
  const analysis = await callWithPremiumSyncRetry(() =>
    postAuthenticatedJson(
      "/api/resume/analyze",
      {
        jobRole: resolvedJobRole,
        resumeText: String(args.resumeText || "").substring(0, 12000)
      },
      {
        rateLimitMessage: "Too many resume analysis requests. Please wait a moment and try again.",
        usageLimitMessage: getPremiumAwareUsageLimitMessage(
          "You have used your free resume analysis for this month."
        )
      }
    )
  );

  return normalizeResumeAnalysis(analysis);
};

export const analyzeResumePdf = async (asset, jobRole) => {
  const resolvedJobRole = await resolveJobRole(jobRole);

  if (!asset?.uri) {
    throw new ApiClientError("Please upload a PDF resume.", 400, "MISSING_RESUME_FILE");
  }

  const createResumeFormData = () => {
    const formData = new FormData();

    formData.append("jobRole", resolvedJobRole);
    formData.append("resume", {
      uri: asset.uri,
      type: "application/pdf",
      name: asset.name || "resume.pdf"
    });

    return formData;
  };

  const analysis = await callWithPremiumSyncRetry(() =>
    postAuthenticatedFormData("/api/resume/analyze", createResumeFormData(), {
      logBody: {
        hasResumeFile: true,
        jobRole: resolvedJobRole
      },
      rateLimitMessage: "Too many resume analysis requests. Please wait a moment and try again.",
      usageLimitMessage: getPremiumAwareUsageLimitMessage(
        "You have used your free resume analysis for this month."
      )
    })
  );

  return normalizeResumeAnalysis(analysis);
};

export const generateInterviewQuestion = generateQuestion;
