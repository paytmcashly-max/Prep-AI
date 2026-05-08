import Constants from "expo-constants";
import { Platform } from "react-native";

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
  isPremium: false,
  activeEntitlements: [],
  source: "placeholder"
};

const PREMIUM_FEATURE_SET = new Set(Object.values(PREMIUM_FEATURES));

let purchasesModule = null;
let hasConfiguredPurchases = false;
let configuredKeySource = "none";
let cachedCustomerInfo = null;

const createDefaultSubscriptionStatus = () => ({
  ...DEFAULT_SUBSCRIPTION_STATUS,
  activeEntitlements: []
});

const getExtra = (key) => Constants.expoConfig?.extra?.[key] || Constants.manifest?.extra?.[key];

const isDevelopment = () => typeof __DEV__ !== "undefined" && __DEV__;

const logRevenueCatDebug = (message, metadata = {}) => {
  if (isDevelopment()) {
    console.log("RevenueCat:", {
      message,
      ...metadata
    });
  }
};

const getRevenueCatApiKey = () => {
  const testStoreApiKey =
    process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY || getExtra("revenueCatTestStoreApiKey");

  if (isDevelopment() && testStoreApiKey) {
    return {
      apiKey: testStoreApiKey,
      keySource: "test_store"
    };
  }

  if (Platform.OS === "ios") {
    return {
      apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || getExtra("revenueCatIosApiKey"),
      keySource: "ios"
    };
  }

  if (Platform.OS === "android") {
    return {
      apiKey:
        process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || getExtra("revenueCatAndroidApiKey"),
      keySource: "android"
    };
  }

  return {
    apiKey: null,
    keySource: "none"
  };
};

const getRevenueCatEntitlementId = () =>
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ||
  getExtra("revenueCatEntitlementId") ||
  "premium";

const getPurchasesModule = async () => {
  if (purchasesModule) {
    return purchasesModule;
  }

  const module = await import("react-native-purchases");
  purchasesModule = module.default || module;
  return purchasesModule;
};

const getActiveEntitlements = (customerInfo) =>
  Object.keys(customerInfo?.entitlements?.active || {});

const mapCustomerInfoToStatus = (customerInfo) => {
  const activeEntitlements = getActiveEntitlements(customerInfo);
  const isPremium = activeEntitlements.includes(getRevenueCatEntitlementId());

  logRevenueCatDebug("entitlement checked", {
    entitlementActive: isPremium
  });

  return {
    isPremium,
    activeEntitlements,
    source: "revenuecat"
  };
};

export const configurePurchases = async () => {
  const { apiKey, keySource } = getRevenueCatApiKey();

  if (!apiKey) {
    hasConfiguredPurchases = false;
    configuredKeySource = "none";
    logRevenueCatDebug("configuration skipped", {
      keySource: "none"
    });
    return false;
  }

  if (hasConfiguredPurchases) {
    logRevenueCatDebug("already configured", {
      keySource: configuredKeySource
    });
    return true;
  }

  try {
    const Purchases = await getPurchasesModule();
    Purchases.configure({ apiKey });
    hasConfiguredPurchases = true;
    configuredKeySource = keySource;
    logRevenueCatDebug("configured", {
      keySource
    });
    return true;
  } catch (error) {
    hasConfiguredPurchases = false;
    configuredKeySource = "none";
    logRevenueCatDebug("configuration failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      keySource
    });
    return false;
  }
};

export const getSubscriptionStatus = async () => {
  const isConfigured = await configurePurchases();

  if (!isConfigured) {
    logRevenueCatDebug("entitlement checked", {
      entitlementActive: false
    });
    return createDefaultSubscriptionStatus();
  }

  try {
    const Purchases = await getPurchasesModule();
    cachedCustomerInfo = await Purchases.getCustomerInfo();
    return mapCustomerInfoToStatus(cachedCustomerInfo);
  } catch (error) {
    logRevenueCatDebug("customer info failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
    return createDefaultSubscriptionStatus();
  }
};

export const isPremiumUser = async () => {
  const status = await getSubscriptionStatus();
  return status.isPremium;
};

export const refreshSubscriptionStatus = async () => {
  cachedCustomerInfo = null;
  return getSubscriptionStatus();
};

export const getOfferings = async () => {
  const isConfigured = await configurePurchases();

  if (!isConfigured) {
    logRevenueCatDebug("offerings loaded", {
      offeringsCount: 0,
      packageCount: 0
    });
    return null;
  }

  try {
    const Purchases = await getPurchasesModule();
    const offerings = await Purchases.getOfferings();
    const offeringsCount = Object.keys(offerings?.all || {}).length;
    const packageCount = offerings?.current?.availablePackages?.length || 0;

    logRevenueCatDebug("offerings loaded", {
      offeringsCount,
      packageCount
    });

    return offerings;
  } catch (error) {
    logRevenueCatDebug("offerings failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  }
};

export const purchasePackage = async (packageToPurchase) => {
  const isConfigured = await configurePurchases();

  if (!isConfigured || !packageToPurchase) {
    return createDefaultSubscriptionStatus();
  }

  const Purchases = await getPurchasesModule();

  try {
    const purchaseResult = await Purchases.purchasePackage(packageToPurchase);
    cachedCustomerInfo = purchaseResult.customerInfo;
    return mapCustomerInfoToStatus(cachedCustomerInfo);
  } catch (error) {
    if (
      error?.userCancelled ||
      error?.code === Purchases.PURCHASES_ERROR_CODE?.PURCHASE_CANCELLED_ERROR
    ) {
      logRevenueCatDebug("purchase cancelled");
      throw new Error("PURCHASE_CANCELLED");
    }

    logRevenueCatDebug("purchase failed", {
      errorCode: error?.code || "unknown",
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
    throw new Error("PURCHASE_FAILED");
  }
};

export const restorePurchases = async () => {
  const isConfigured = await configurePurchases();

  if (!isConfigured) {
    return createDefaultSubscriptionStatus();
  }

  try {
    const Purchases = await getPurchasesModule();
    cachedCustomerInfo = await Purchases.restorePurchases();
    return mapCustomerInfoToStatus(cachedCustomerInfo);
  } catch (error) {
    logRevenueCatDebug("restore failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
    return createDefaultSubscriptionStatus();
  }
};

export const canAccessFeature = async (featureKey) => {
  if (!PREMIUM_FEATURE_SET.has(featureKey)) {
    return false;
  }

  const status = cachedCustomerInfo
    ? mapCustomerInfoToStatus(cachedCustomerInfo)
    : await getSubscriptionStatus();

  return status.isPremium;
};
