import { useState } from "react";

import AppButton from "../ui/AppButton";
import { getGoogleAuthProblem, signInWithGoogle } from "../../services/authService";

export default function GoogleSignInButton({ disabled, onError, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleAuthProblem = getGoogleAuthProblem();

  const handlePress = async () => {
    if (googleAuthProblem === "expo-go") {
      onError?.(
        new Error(
          "Google sign-in does not work in Expo Go. Please test it in a development build, preview APK, or production app build."
        )
      );
      return;
    }

    if (googleAuthProblem) {
      onError?.(
        new Error(
          "Google sign-in is not configured for this build. Add the required Google client IDs, Google services file, and signing fingerprints, then rebuild the app."
        )
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await signInWithGoogle();
      onSuccess?.();
    } catch (error) {
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppButton
      disabled={disabled || isSubmitting}
      loading={isSubmitting}
      onPress={handlePress}
      tone="secondary"
    >
      Continue with Google
    </AppButton>
  );
}
