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
    enableVoiceFeature: process.env.EXPO_PUBLIC_ENABLE_VOICE_FEATURE,
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    analyticsEnabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED,
    privacyPolicyUrl:
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || appJson.expo.extra?.privacyPolicyUrl,
    termsUrl: process.env.EXPO_PUBLIC_TERMS_URL || appJson.expo.extra?.termsUrl,
    refundPolicyUrl:
      process.env.EXPO_PUBLIC_REFUND_POLICY_URL || appJson.expo.extra?.refundPolicyUrl,
    deliveryPolicyUrl:
      process.env.EXPO_PUBLIC_DELIVERY_POLICY_URL || appJson.expo.extra?.deliveryPolicyUrl,
    supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || appJson.expo.extra?.supportEmail
  }
});
