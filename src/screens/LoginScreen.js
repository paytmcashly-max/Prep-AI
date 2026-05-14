import { useState } from "react";
import { StyleSheet, View } from "react-native";

import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import HapticPressable from "../components/HapticPressable";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppInput from "../components/ui/AppInput";
import AuthScaffold from "../components/ui/AuthScaffold";
import AppText from "../components/ui/AppText";
import MessageCard from "../components/ui/MessageCard";
import { trackEvent } from "../services/analyticsService";
import { getFirebaseConfigGuardMessage, signInWithEmail } from "../services/authService";
import { SPACING } from "../theme";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const authConfigGuardMessage = getFirebaseConfigGuardMessage();
  const isAuthBlocked = Boolean(authConfigGuardMessage);

  const handleLogin = async () => {
    if (isAuthBlocked) {
      return;
    }

    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Enter your email and password to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmail(email, password);
      trackEvent("login_success");
    } catch (error) {
      setErrorMessage(error.message || "Could not sign you in. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = (error) => {
    setErrorMessage(error.message || "Google sign-in could not be completed.");
  };

  return (
    <AuthScaffold
      eyebrow="Welcome back"
      subtitle="Continue your saved mock interviews, resume checks, and progress."
      title="Sign in to IntervueAI"
    >
      <AppCard style={styles.formCard}>
        {errorMessage ? (
          <MessageCard message={errorMessage} title="Sign in failed" tone="error" />
        ) : null}
        {isAuthBlocked ? (
          <MessageCard
            message={authConfigGuardMessage}
            title="App configuration error"
            tone="warning"
          />
        ) : null}

        <AppInput
          autoCapitalize="none"
          autoComplete="email"
          editable={!isSubmitting && !isAuthBlocked}
          icon="mail"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          returnKeyType="next"
          textContentType="emailAddress"
          value={email}
        />
        <AppInput
          autoComplete="password"
          editable={!isSubmitting && !isAuthBlocked}
          icon="lock"
          label="Password"
          onChangeText={setPassword}
          placeholder="Enter password"
          returnKeyType="done"
          secureTextEntry
          textContentType="password"
          value={password}
        />

        <AppButton
          disabled={isSubmitting || isAuthBlocked}
          loading={isSubmitting}
          onPress={handleLogin}
        >
          Sign in
        </AppButton>

        {!isAuthBlocked ? (
          <GoogleSignInButton
            disabled={isSubmitting}
            onError={handleGoogleError}
            onSuccess={() => trackEvent("login_success_google")}
          />
        ) : null}

        <AppText tone="muted" variant="bodyMuted">
          Email accounts need an activation link before they can enter the app.
        </AppText>
      </AppCard>

      <View style={styles.footer}>
        <AppText tone="muted" variant="bodyMuted">
          New to IntervueAI?
        </AppText>
        <HapticPressable onPress={() => navigation.navigate("Signup")} hitSlop={10}>
          <AppText tone="primary" variant="button">
            Create account
          </AppText>
        </HapticPressable>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    justifyContent: "center"
  },
  formCard: {
    gap: SPACING.lg
  }
});
