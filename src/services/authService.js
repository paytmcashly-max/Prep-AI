import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  updateProfile
} from "firebase/auth";
import { Platform } from "react-native";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes
} from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, firestore, getFirebaseConfigProblem } from "./firebaseConfig";
import { useProgressStore } from "../store/progressStore";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useUserStore } from "../store/userStore";

let lastAuthAction = null;
let hasConfiguredGoogleSignIn = false;

export const consumeLastAuthAction = () => {
  const action = lastAuthAction;
  lastAuthAction = null;
  return action;
};

const requireFirebaseConfig = () => {
  const configProblem = getFirebaseConfigProblem();

  if (configProblem === "missing") {
    throw new Error(
      "Missing Firebase environment variables. Add your Firebase config to .env and restart Expo."
    );
  }

  if (configProblem === "invalid-api-key") {
    throw new Error(
      "Invalid Firebase API key for this build. Check EAS preview env: EXPO_PUBLIC_FIREBASE_API_KEY must be your Firebase Web API key."
    );
  }
};

export const getFirebaseConfigGuardMessage = () => {
  const configProblem = getFirebaseConfigProblem();

  if (configProblem === "missing") {
    return "This preview build is missing its Firebase setup. Add the required Expo public Firebase values to the preview environment and rebuild the app.";
  }

  if (configProblem === "invalid-api-key") {
    return "This preview build has an invalid Firebase Web API key. Update the preview environment with the correct Firebase Web API key and rebuild the app.";
  }

  return "";
};

const getFriendlyAuthError = (error) => {
  if (error?.message === "GOOGLE_SIGN_IN_CANCELLED") {
    return new Error("Google sign-in was cancelled.");
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
    case "auth/popup-closed-by-user":
      return new Error("Google sign-in was closed before it finished.");
    case "auth/cancelled-popup-request":
      return new Error("Google sign-in was cancelled. Please try again.");
    case "auth/invalid-api-key":
      return new Error(
        "Invalid Firebase API key for this build. Check EAS preview env: EXPO_PUBLIC_FIREBASE_API_KEY must be your Firebase Web API key."
      );
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return new Error("Google Play Services is not available on this device.");
    case statusCodes.IN_PROGRESS:
      return new Error("Google sign-in is already in progress. Please wait a moment.");
    default:
      return error;
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
  if (Constants.appOwnership === "expo") {
    return "expo-go";
  }

  if (!isFirebaseAuthReady()) {
    return "firebase-config";
  }

  const config = getGoogleAuthConfig();

  if (!config.webClientId) {
    return "missing-web-client-id";
  }

  if (Platform.OS === "android" && !config.androidClientId) {
    return "missing-android-client-id";
  }

  return null;
};

const ensureGoogleSignInConfigured = () => {
  if (hasConfiguredGoogleSignIn) {
    return;
  }

  const config = getGoogleAuthConfig();

  GoogleSignin.configure({
    offlineAccess: false,
    scopes: config.scopes,
    webClientId: config.webClientId,
    ...(config.iosClientId ? { iosClientId: config.iosClientId } : {})
  });
  hasConfiguredGoogleSignIn = true;
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

    try {
      await sendEmailVerification(credential.user);
    } catch {
      // The account still exists; the verification screen can resend the link.
    }

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
    throw getFriendlyAuthError(error);
  }
};

export const signInWithGoogle = async () => {
  requireFirebaseConfig();
  const googleAuthProblem = getGoogleAuthProblem();

  if (googleAuthProblem) {
    throw new Error(
      "Google sign-in is not configured for this build. Add the required Google client IDs, Google services file, and signing fingerprints, then rebuild the app."
    );
  }

  try {
    ensureGoogleSignInConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (response.type !== "success") {
      throw new Error("GOOGLE_SIGN_IN_CANCELLED");
    }

    if (!response.data?.idToken) {
      throw new Error("Google sign-in did not return an ID token.");
    }

    return signInWithGoogleIdToken(response.data.idToken);
  } catch (error) {
    if (isErrorWithCode(error)) {
      throw getFriendlyAuthError(error);
    }

    throw getFriendlyAuthError(error);
  }
};

export const sendActivationEmail = async () => {
  requireFirebaseConfig();

  if (!auth.currentUser) {
    throw new Error("Please log in again.");
  }

  await sendEmailVerification(auth.currentUser);
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
