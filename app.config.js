const appJson = require("./app.json");

const plugins = [
  ...(appJson.expo.plugins || []),
  ...(appJson.expo.plugins?.includes("@sentry/react-native") ? [] : ["@sentry/react-native"])
];

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  plugins,
  extra: {
    ...(appJson.expo.extra || {}),
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    analyticsEnabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED,
    revenueCatTestStoreApiKey: process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY,
    revenueCatIosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    revenueCatAndroidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    revenueCatBillingProvider: process.env.EXPO_PUBLIC_REVENUECAT_BILLING_PROVIDER,
    revenueCatEntitlementId: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID,
    privacyPolicyUrl:
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || appJson.expo.extra?.privacyPolicyUrl,
    termsUrl: process.env.EXPO_PUBLIC_TERMS_URL || appJson.expo.extra?.termsUrl,
    supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || appJson.expo.extra?.supportEmail
  }
});
