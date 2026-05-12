import { Linking } from "react-native";

import { getAuthenticatedJson, postAuthenticatedJson } from "./apiClient";

export const PREMIUM_FEATURES = {
  UNLIMITED_INTERVIEWS: "unlimited_interviews",
  UNLIMITED_ANSWER_EVALUATIONS: "unlimited_answer_evaluations",
  UNLIMITED_RESUME_ANALYSIS: "unlimited_resume_analysis",
  VOICE_INTERVIEW: "voice_interview",
  VIDEO_INTERVIEW: "video_interview",
  DETAILED_FEEDBACK: "detailed_feedback",
  IMPROVED_RESUME_DOWNLOAD: "improved_resume_download"
};

const DEFAULT_SUBSCRIPTION_STATUS = {
  activeEntitlements: [],
  availablePlans: [],
  expirationDate: null,
  isPremium: false,
  paymentAvailable: false,
  plan: null,
  provider: "razorpay",
  source: "razorpay",
  verificationStatus: "none"
};

const PREMIUM_FEATURE_SET = new Set(Object.values(PREMIUM_FEATURES));

const createDefaultSubscriptionStatus = () => ({
  ...DEFAULT_SUBSCRIPTION_STATUS,
  activeEntitlements: [],
  availablePlans: []
});

const normalizeSubscriptionStatus = (status = {}) => ({
  ...createDefaultSubscriptionStatus(),
  ...status,
  activeEntitlements: [],
  availablePlans: Array.isArray(status.plans) ? status.plans : [],
  isPremium: Boolean(
    status.isPremium &&
    status.provider === "razorpay" &&
    status.verificationStatus === "server_verified"
  ),
  provider: "razorpay",
  source: "razorpay"
});

export const getSubscriptionStatus = async () => {
  try {
    const status = await getAuthenticatedJson("/api/subscription/status");
    return normalizeSubscriptionStatus(status);
  } catch (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("Subscription status unavailable", {
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
    }

    return createDefaultSubscriptionStatus();
  }
};

export const identifySubscriptionUser = async () => getSubscriptionStatus();

export const resetSubscriptionUser = async () => {};

export const isPremiumUser = async () => {
  const status = await getSubscriptionStatus();
  return status.isPremium;
};

export const refreshSubscriptionStatus = async () => getSubscriptionStatus();

export const createRazorpayOrder = async (plan) =>
  postAuthenticatedJson("/api/payments/razorpay/order", { plan });

export const openRazorpayPayment = async (order) => {
  if (!order?.paymentUrl) {
    throw new Error("PAYMENT_UNAVAILABLE");
  }

  await Linking.openURL(order.paymentUrl);
};

export const verifyRazorpayPayment = async (payload) =>
  postAuthenticatedJson("/api/payments/razorpay/verify", payload);

export const canAccessFeature = async (featureKey) => {
  if (!PREMIUM_FEATURE_SET.has(featureKey)) {
    return false;
  }

  const status = await getSubscriptionStatus();
  return status.isPremium;
};
