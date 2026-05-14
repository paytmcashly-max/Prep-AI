import Constants from "expo-constants";

const SAFE_EVENT_NAMES = new Set([
  "app_opened",
  "signup_started",
  "login_success",
  "interview_started",
  "interview_question_generated",
  "answer_submitted",
  "answer_evaluated",
  "question_timed_out",
  "resume_analysis_started",
  "resume_analysis_completed",
  "usage_limit_reached",
  "voice_transcription_requested",
  "voice_transcription_completed",
  "voice_transcription_failed"
]);

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|idtoken|id_token|api.?key|private.?key|groq|openai|password|resume|answer|email|name|phone|profile)/i;

let isAnalyticsEnabled = false;

const getAnalyticsEnabled = () => {
  const value =
    process.env.EXPO_PUBLIC_ANALYTICS_ENABLED ||
    Constants.expoConfig?.extra?.analyticsEnabled ||
    Constants.manifest?.extra?.analyticsEnabled;

  return value === true || value === "true";
};

const sanitizeProperties = (properties = {}) =>
  Object.entries(properties).reduce((safeProperties, [key, value]) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      return safeProperties;
    }

    if (["boolean", "number", "string"].includes(typeof value) || value === null) {
      return {
        ...safeProperties,
        [key]: value
      };
    }

    return safeProperties;
  }, {});

export const initializeAnalytics = () => {
  isAnalyticsEnabled = getAnalyticsEnabled();
  return isAnalyticsEnabled;
};

export const trackEvent = (eventName, properties = {}) => {
  if (!isAnalyticsEnabled || !SAFE_EVENT_NAMES.has(eventName)) {
    return;
  }

  sanitizeProperties(properties);
};

export const identifyUser = (userId) => {
  if (!isAnalyticsEnabled || !userId) {
    return;
  }
};

export const resetAnalytics = () => {
  if (!isAnalyticsEnabled) {
    return;
  }
};
