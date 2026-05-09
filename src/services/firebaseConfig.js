import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const extra = Constants.expoConfig?.extra || {};

const envFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extra.firebaseApiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || extra.firebaseAuthDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extra.firebaseProjectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || extra.firebaseStorageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || extra.firebaseMessagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extra.firebaseAppId,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || extra.firebaseMeasurementId
};

const REQUIRED_FIREBASE_KEYS = [
  ["apiKey", "EXPO_PUBLIC_FIREBASE_API_KEY"],
  ["authDomain", "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"],
  ["projectId", "EXPO_PUBLIC_FIREBASE_PROJECT_ID"],
  ["storageBucket", "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"],
  ["messagingSenderId", "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"],
  ["appId", "EXPO_PUBLIC_FIREBASE_APP_ID"]
];

export const missingFirebaseConfigKeys = REQUIRED_FIREBASE_KEYS.filter(
  ([configKey]) => !envFirebaseConfig[configKey]
).map(([, envKey]) => envKey);

export const isFirebaseConfigured = Boolean(missingFirebaseConfigKeys.length === 0);

export const isFirebaseApiKeyValid = /^AIza[0-9A-Za-z_-]+$/.test(
  String(envFirebaseConfig.apiKey || "")
);

export const getFirebaseConfigProblem = () => {
  if (!isFirebaseConfigured) {
    return "missing";
  }

  if (!isFirebaseApiKeyValid) {
    return "invalid-api-key";
  }

  return null;
};

const firebaseConfig = envFirebaseConfig;

if (!isFirebaseConfigured && typeof __DEV__ !== "undefined" && __DEV__) {
  console.warn("Firebase config is incomplete. Missing Expo public env keys:", {
    missingKeys: missingFirebaseConfigKeys
  });
}

const app = initializeApp(firebaseConfig);

const authOptions =
  typeof getReactNativePersistence === "function"
    ? {
        persistence: getReactNativePersistence(AsyncStorage)
      }
    : undefined;

let authInstance;

try {
  authInstance = initializeAuth(app, authOptions);
} catch (error) {
  if (error?.code !== "auth/already-initialized") {
    throw error;
  }

  authInstance = getAuth(app);
}

export const auth = authInstance;

export const firebaseApp = app;
export const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});
export const firebaseStorage = getStorage(app);
export const firebaseAuth = auth;
export { firebaseConfig };
