import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|idtoken|id_token|api.?key|private.?key|groq|openai|password|resume|answer|email|name|phone)/i;

let isInitialized = false;

const getSentryDsn = () =>
  process.env.EXPO_PUBLIC_SENTRY_DSN ||
  Constants.expoConfig?.extra?.sentryDsn ||
  Constants.manifest?.extra?.sentryDsn;

const sanitizeValue = (value, depth = 0) => {
  if (depth > 5) {
    return "[Truncated]";
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  return Object.entries(value).reduce((safeValue, [key, item]) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      return {
        ...safeValue,
        [key]: "[Filtered]"
      };
    }

    return {
      ...safeValue,
      [key]: sanitizeValue(item, depth + 1)
    };
  }, {});
};

const sanitizeBreadcrumb = (breadcrumb) => {
  const safeBreadcrumb = sanitizeValue(breadcrumb);
  delete safeBreadcrumb.message;

  return safeBreadcrumb;
};

const sanitizeEvent = (event) => {
  const safeEvent = sanitizeValue(event);
  delete safeEvent.message;
  delete safeEvent.request;
  delete safeEvent.user;

  if (safeEvent.exception?.values) {
    safeEvent.exception.values = safeEvent.exception.values.map((exception) => ({
      ...exception,
      value: "[Filtered]"
    }));
  }

  return safeEvent;
};

export const initializeErrorTracking = () => {
  const dsn = getSentryDsn();

  if (!dsn || isInitialized) {
    return false;
  }

  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    attachScreenshot: false,
    attachViewHierarchy: false,
    beforeBreadcrumb: sanitizeBreadcrumb,
    beforeSend: sanitizeEvent
  });

  isInitialized = true;
  return true;
};

export const captureAppError = (error, metadata = {}) => {
  if (!isInitialized) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setContext("safe_metadata", sanitizeValue(metadata));
    Sentry.captureException(error);
  });
};

export const withErrorTracking = (AppComponent) => {
  if (!isInitialized) {
    return AppComponent;
  }

  return Sentry.wrap(AppComponent);
};
