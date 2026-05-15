import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  reload,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  updateProfile
} from "firebase/auth";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, firestore, getFirebaseConfigProblem } from "./firebaseConfig";
import { isGoogleAuthEnabled } from "./featureFlags";
import { postAuthenticatedJson } from "./apiClient";
import { useProgressStore } from "../store/progressStore";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useUserStore } from "../store/userStore";

let lastAuthAction = null;
let hasConfiguredGoogleSignIn = false;
let googleSignInModule = null;
const FIREBASE_BUILD_CONFIG_MESSAGE =
  "Firebase configuration is missing for this build. Please check EAS preview environment variables and rebuild the APK.";
const GOOGLE_BUILD_CONFIG_MESSAGE =
  "Google sign-in is not configured for this build. Please use email/password or update Android OAuth/SHA settings.";
const GOOGLE_STATUS_CODES = {
  IN_PROGRESS: "IN_PROGRESS",
  PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED"
};

export const getFirebaseBuildConfigMessage = () => FIREBASE_BUILD_CONFIG_MESSAGE;
export const getGoogleBuildConfigMessage = () => GOOGLE_BUILD_CONFIG_MESSAGE;
export const isBuildConfigAuthMessage = (message) =>
  [FIREBASE_BUILD_CONFIG_MESSAGE, GOOGLE_BUILD_CONFIG_MESSAGE].includes(String(message || ""));

export const consumeLastAuthAction = () => {
  const action = lastAuthAction;
  lastAuthAction = null;
  return action;
};

const requireFirebaseConfig = () => {
  const configProblem = getFirebaseConfigProblem();

  if (configProblem === "missing") {
    throw new Error(FIREBASE_BUILD_CONFIG_MESSAGE);
  }

  if (configProblem === "invalid-api-key") {
    throw new Error(FIREBASE_BUILD_CONFIG_MESSAGE);
  }
};

export const getFirebaseConfigGuardMessage = () => {
  const configProblem = getFirebaseConfigProblem();

  if (configProblem === "missing" || configProblem === "invalid-api-key") {
    return FIREBASE_BUILD_CONFIG_MESSAGE;
  }

  return "";
};

const getFriendlyAuthError = (error) => {
  const errorCode = String(error?.code || "");
  const errorMessage = String(error?.message || "");
  const errorDetails = `${errorCode} ${errorMessage}`.toLowerCase();
  const hasDeveloperError =
    errorDetails.includes("developer_error") ||
    errorDetails.includes("developer error") ||
    errorCode === "DEVELOPER_ERROR" ||
    errorCode === "10";

  if (error?.message === "GOOGLE_SIGN_IN_CANCELLED") {
    return new Error("Google sign-in was cancelled.");
  }

  if (hasDeveloperError) {
    return new Error(GOOGLE_BUILD_CONFIG_MESSAGE);
  }

  if (
    errorDetails.includes("auth/api-key-not-found") ||
    errorDetails.includes("auth/invalid-api-key") ||
    errorDetails.includes("auth/api-key-expired")
  ) {
    return new Error(FIREBASE_BUILD_CONFIG_MESSAGE);
  }

  switch (error?.code) {
    case "auth/operation-not-allowed":
      return new Error(
        "Email/password sign-in is not enabled in Firebase. Enable Email/Password under Firebase Console > Authentication > Sign-in method."
      );
    case "auth/invalid-email":
      return new Error("Please enter a valid email address.");
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return new Error("Incorrect email or password.");
    case "auth/email-already-in-use":
      return new Error("An account already exists with this email. Please login instead.");
    case "auth/weak-password":
      return new Error("Please use a stronger password.");
    case "auth/network-request-failed":
      return new Error("Network error. Please check your internet connection and try again.");
    case "auth/api-key-not-found":
    case "auth/invalid-api-key":
    case "auth/api-key-expired":
      return new Error(FIREBASE_BUILD_CONFIG_MESSAGE);
    case "auth/popup-closed-by-user":
      return new Error("Google sign-in was closed before it finished.");
    case "auth/cancelled-popup-request":
      return new Error("Google sign-in was cancelled. Please try again.");
    case GOOGLE_STATUS_CODES.PLAY_SERVICES_NOT_AVAILABLE:
      return new Error("Google Play Services is not available on this device.");
    case GOOGLE_STATUS_CODES.IN_PROGRESS:
      return new Error("Google sign-in is already in progress. Please wait a moment.");
    case GOOGLE_STATUS_CODES.SIGN_IN_CANCELLED:
      return new Error("Google sign-in was cancelled.");
    case "DEVELOPER_ERROR":
    case 10:
      return new Error(GOOGLE_BUILD_CONFIG_MESSAGE);
    default:
      return error;
  }
};

const getGoogleSignInModule = () => {
  if (googleSignInModule) {
    return googleSignInModule;
  }

  try {
    googleSignInModule = require("@react-native-google-signin/google-signin");
    return googleSignInModule;
  } catch {
    throw new Error(GOOGLE_BUILD_CONFIG_MESSAGE);
  }
};

const getGoogleAuthConfig = () => ({
  androidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    Constants.expoConfig?.extra?.googleAndroidClientId ||
    "",
  iosClientId:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    Constants.expoConfig?.extra?.googleIosClientId ||
    "",
  scopes: ["profile", "email"],
  selectAccount: true,
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    Constants.expoConfig?.extra?.googleWebClientId ||
    ""
});

const logGoogleDebug = (label, details = {}) => {
  if (!(typeof __DEV__ !== "undefined" && __DEV__)) {
    return;
  }

  console.warn(`[google-auth] ${label}`, details);
};

const upsertUserProfileDoc = async (user, { email, fullName, onboardingCompleted = false } = {}) =>
  setDoc(
    doc(firestore, "users", user.uid),
    {
      fullName: fullName || user.displayName || "",
      name: fullName || user.displayName || "",
      email: user.email || email || "",
      onboardingCompleted,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

export const requiresEmailVerification = (user) =>
  Boolean(
    user?.providerData?.some((provider) => provider?.providerId === "password") &&
    user?.email &&
    !user?.emailVerified
  );

export const isUserVerifiedForApp = (user) => Boolean(user) && !requiresEmailVerification(user);
export const isFirebaseAuthReady = () => !getFirebaseConfigProblem();

export const getGoogleAuthProblem = () => {
  if (!isGoogleAuthEnabled) {
    return "disabled";
  }

  if (Constants.appOwnership === "expo") {
    return "expo-go";
  }

  if (!isFirebaseAuthReady()) {
    return "firebase-config";
  }

  const config = getGoogleAuthConfig();

  if (Platform.OS !== "android" && !config.webClientId) {
    return "missing-web-client-id";
  }

  return null;
};

const ensureGoogleSignInConfigured = () => {
  if (hasConfiguredGoogleSignIn) {
    return;
  }

  const { GoogleSignin } = getGoogleSignInModule();
  const config = getGoogleAuthConfig();
  const shouldUseNativeAndroidClientConfig = Platform.OS === "android";

  const googleSignInConfig = {
    offlineAccess: false,
    scopes: config.scopes,
    ...(!shouldUseNativeAndroidClientConfig && config.webClientId
      ? { webClientId: config.webClientId }
      : {}),
    ...(config.iosClientId ? { iosClientId: config.iosClientId } : {})
  };

  logGoogleDebug("configure", {
    platform: Platform.OS,
    hasAndroidClientId: Boolean(config.androidClientId),
    hasWebClientId: Boolean(config.webClientId),
    appOwnership: Constants.appOwnership,
    requestsIdToken: shouldUseNativeAndroidClientConfig
      ? "native-google-services"
      : Boolean(config.webClientId)
  });
  GoogleSignin.configure(googleSignInConfig);
  hasConfiguredGoogleSignIn = true;
};

const getGoogleIdToken = async (signInResponse) => {
  const { GoogleSignin } = getGoogleSignInModule();
  const directIdToken = signInResponse?.data?.idToken;
  logGoogleDebug("sign-in response", {
    responseType: signInResponse?.type,
    hasDirectIdToken: Boolean(directIdToken),
    hasServerAuthCode: Boolean(signInResponse?.data?.serverAuthCode)
  });

  if (directIdToken) {
    return directIdToken;
  }

  const tokens = await GoogleSignin.getTokens();
  logGoogleDebug("token fetch", {
    hasFetchedIdToken: Boolean(tokens?.idToken),
    hasAccessToken: Boolean(tokens?.accessToken)
  });
  return tokens?.idToken || "";
};

const sendVerificationEmailViaBackend = async ({ suppressErrors = false } = {}) => {
  if (!auth.currentUser) {
    if (suppressErrors) {
      return;
    }

    throw new Error("Please log in again.");
  }

  try {
    await postAuthenticatedJson("/api/auth/send-verification-email", {}, { timeoutMs: 20000 });
  } catch (error) {
    let friendlyError = error;

    if (error?.status === 404) {
      friendlyError = new Error(
        "Verification email is not available on this backend yet. Please redeploy the server and try again."
      );
    }

    if (__DEV__) {
      console.warn("Verification email send via backend failed.", {
        errorCode: error?.code,
        errorMessage: error?.message,
        errorStatus: error?.status
      });
    }

    if (suppressErrors) {
      return;
    }

    throw friendlyError;
  }
};

export const signInWithEmail = async (email, password) => {
  requireFirebaseConfig();
  lastAuthAction = "login";

  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);

    return credential.user;
  } catch (error) {
    lastAuthAction = null;
    throw getFriendlyAuthError(error);
  }
};

export const signUpWithEmail = async (name, email, password) => {
  requireFirebaseConfig();
  lastAuthAction = "signup";

  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const displayName = name.trim();

    if (displayName) {
      await updateProfile(credential.user, { displayName });
      useUserStore.getState().updateProfile({
        fullName: displayName,
        name: displayName
      });
    }

    upsertUserProfileDoc(credential.user, {
      email: email.trim(),
      fullName: displayName,
      onboardingCompleted: false
    }).catch((error) => {
      if (__DEV__) {
        console.warn("Initial profile document could not be created.", {
          errorCode: error?.code,
          errorMessage: error?.message
        });
      }
    });

    await sendVerificationEmailViaBackend({ suppressErrors: true });

    return credential.user;
  } catch (error) {
    lastAuthAction = null;
    throw getFriendlyAuthError(error);
  }
};

export const signInWithGoogleIdToken = async (idToken) => {
  requireFirebaseConfig();
  lastAuthAction = "login";

  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const displayName = result.user.displayName || "";

    if (displayName) {
      useUserStore.getState().updateProfile({
        fullName: displayName,
        name: displayName
      });
    }

    upsertUserProfileDoc(result.user, {
      email: result.user.email || "",
      fullName: displayName,
      onboardingCompleted: false
    }).catch(() => {});

    return result.user;
  } catch (error) {
    lastAuthAction = null;

    if (__DEV__) {
      console.warn("[google-auth] firebase credential exchange failed", {
        errorCode: error?.code || null,
        errorMessage: error?.message || null
      });
    }

    throw getFriendlyAuthError(error);
  }
};

export const signInWithGoogle = async () => {
  requireFirebaseConfig();
  const googleAuthProblem = getGoogleAuthProblem();
  const googleSignIn = getGoogleSignInModule();

  if (googleAuthProblem) {
    throw new Error(GOOGLE_BUILD_CONFIG_MESSAGE);
  }

  try {
    const { GoogleSignin } = googleSignIn;
    ensureGoogleSignInConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (response.type !== "success") {
      throw new Error("GOOGLE_SIGN_IN_CANCELLED");
    }

    const idToken = await getGoogleIdToken(response);

    if (!idToken) {
      throw new Error("Google sign-in did not return an ID token.");
    }

    return signInWithGoogleIdToken(idToken);
  } catch (error) {
    if (googleSignIn?.isErrorWithCode?.(error)) {
      throw getFriendlyAuthError(error);
    }

    throw getFriendlyAuthError(error);
  }
};

export const sendActivationEmail = async () => {
  requireFirebaseConfig();

  await sendVerificationEmailViaBackend();
};

export const reloadCurrentUser = async () => {
  if (!auth.currentUser) {
    return null;
  }

  await reload(auth.currentUser);
  return auth.currentUser;
};

export const signOut = async () => {
  lastAuthAction = "logout";

  try {
    await firebaseSignOut(auth);
  } finally {
    useUserStore.getState().resetUser();
    useProgressStore.getState().resetProgress();
    useSubscriptionStore.getState().resetSubscription();
  }
};

export const getCurrentUser = () => auth.currentUser;
