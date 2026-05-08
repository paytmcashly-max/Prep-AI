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

export const isFirebaseConfigured = Boolean(
  envFirebaseConfig.apiKey &&
  envFirebaseConfig.authDomain &&
  envFirebaseConfig.projectId &&
  envFirebaseConfig.storageBucket &&
  envFirebaseConfig.messagingSenderId &&
  envFirebaseConfig.appId
);

const firebaseConfig = envFirebaseConfig;

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
