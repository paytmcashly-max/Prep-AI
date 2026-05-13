import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, firestore, getFirebaseConfigProblem } from "./firebaseConfig";
import { useProgressStore } from "../store/progressStore";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useUserStore } from "../store/userStore";

let lastAuthAction = null;

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

const getFriendlyAuthError = (error) => {
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
    case "auth/invalid-api-key":
      return new Error(
        "Invalid Firebase API key for this build. Check EAS preview env: EXPO_PUBLIC_FIREBASE_API_KEY must be your Firebase Web API key."
      );
    default:
      return error;
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

    setDoc(
      doc(firestore, "users", credential.user.uid),
      {
        fullName: displayName,
        name: displayName,
        email: credential.user.email || email.trim(),
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    ).catch((error) => {
      if (__DEV__) {
        console.warn("Initial profile document could not be created.", {
          errorCode: error?.code,
          errorMessage: error?.message
        });
      }
    });

    return credential.user;
  } catch (error) {
    lastAuthAction = null;
    throw getFriendlyAuthError(error);
  }
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
