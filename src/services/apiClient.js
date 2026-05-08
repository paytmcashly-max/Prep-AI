import Constants from "expo-constants";

import { trackEvent } from "./analyticsService";
import { auth } from "./firebaseConfig";

export class ApiClientError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

const getApiBaseUrl = () => {
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    Constants.expoConfig?.extra?.apiBaseUrl ||
    Constants.manifest?.extra?.apiBaseUrl;

  if (!apiBaseUrl) {
    throw new ApiClientError(
      "Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL in the app .env file.",
      0,
      "MISSING_API_BASE_URL"
    );
  }

  return apiBaseUrl.replace(/\/$/, "");
};

const getAuthToken = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new ApiClientError("Please log in again.", 401, "UNAUTHORIZED");
  }

  return user.getIdToken();
};

const getErrorMessage = (status, payload, options = {}) => {
  if (status === 400 && options.badRequestMessage) {
    return options.badRequestMessage;
  }

  if (status === 401) {
    return "Please log in again.";
  }

  if (status === 429) {
    if (payload?.error === "Usage limit reached" && options.usageLimitMessage) {
      return options.usageLimitMessage;
    }

    return payload?.error || "Usage limit reached";
  }

  return payload?.error || "Backend request failed. Please try again.";
};

const SENSITIVE_REQUEST_KEYS = new Set([
  "answer",
  "authorization",
  "firebaseIdToken",
  "idToken",
  "previousQuestions",
  "question",
  "resumeText",
  "token"
]);

const sanitizeRequestBodyForLog = (body) => {
  if (!body || typeof body !== "object") {
    return {};
  }

  return Object.entries(body).reduce((safeBody, [key, value]) => {
    if (SENSITIVE_REQUEST_KEYS.has(key)) {
      return safeBody;
    }

    if (["boolean", "number", "string"].includes(typeof value) || value === null) {
      return {
        ...safeBody,
        [key]: value
      };
    }

    return safeBody;
  }, {});
};

const logDevelopmentRequest = (path, body) => {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("API request", {
      body: sanitizeRequestBodyForLog(body),
      path
    });
  }
};

export const postAuthenticatedJson = async (path, body, options = {}) => {
  try {
    const token = await getAuthToken();

    logDevelopmentRequest(path, body);

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 429 && payload?.error === "Usage limit reached") {
        trackEvent("usage_limit_reached", { endpoint: path });
      }

      throw new ApiClientError(
        getErrorMessage(response.status, payload, options),
        response.status,
        payload?.code
      );
    }

    if (!payload || typeof payload !== "object") {
      throw new ApiClientError(
        "Invalid response from server. Please try again.",
        response.status,
        "INVALID_RESPONSE"
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new ApiClientError("Could not connect to the server.", 0, "NETWORK_ERROR");
  }
};

export const postAuthenticatedFormData = async (path, formData, options = {}) => {
  try {
    const token = await getAuthToken();

    logDevelopmentRequest(path, options.logBody || {});

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 429 && payload?.error === "Usage limit reached") {
        trackEvent("usage_limit_reached", { endpoint: path });
      }

      throw new ApiClientError(
        getErrorMessage(response.status, payload, options),
        response.status,
        payload?.code
      );
    }

    if (!payload || typeof payload !== "object") {
      throw new ApiClientError(
        "Invalid response from server. Please try again.",
        response.status,
        "INVALID_RESPONSE"
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new ApiClientError("Could not connect to the server.", 0, "NETWORK_ERROR");
  }
};
