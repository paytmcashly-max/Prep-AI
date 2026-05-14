import { useState } from "react";
import { StyleSheet, View } from "react-native";

import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import HapticPressable from "../components/HapticPressable";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppInput from "../components/ui/AppInput";
import AppText from "../components/ui/AppText";
import AuthScaffold from "../components/ui/AuthScaffold";
import MessageCard from "../components/ui/MessageCard";
import { trackEvent } from "../services/analyticsService";
import { getFirebaseConfigGuardMessage, signUpWithEmail } from "../services/authService";
import { SPACING } from "../theme";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const authConfigGuardMessage = getFirebaseConfigGuardMessage();
  const isAuthBlocked = Boolean(authConfigGuardMessage);

  const handleSignup = async () => {
    if (isAuthBlocked) {
      return;
    }

    setErrorMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Add your name, email, and a password to create your account.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Use at least 8 characters for your password.");
      return;
    }

    setIsSubmitting(true);
    trackEvent("signup_started");

    try {
      await signUpWithEmail(name, email, password);
    } catch (error) {
      setErrorMessage(error.message || "Could not create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = (error) => {
    setErrorMessage(error.message || "Google sign-in could not be completed.");
  };

  return (
    <AuthScaffold
      eyebrow="Create account"
      subtitle="Set up your profile once, then practice interviews with feedback that stays saved."
      title="Create your IntervueAI account"
    >
      <AppCard style={styles.formCard}>
        {errorMessage ? (
          <MessageCard message={errorMessage} title="Could not create account" tone="error" />
        ) : null}
        {isAuthBlocked ? (
          <MessageCard
            message={authConfigGuardMessage}
            title="App configuration error"
            tone="warning"
          />
        ) : null}

        <AppInput
          autoCapitalize="words"
          autoComplete="name"
          editable={!isSubmitting && !isAuthBlocked}
          icon="user"
          label="Full name"
          onChangeText={setName}
          placeholder="Your name"
          returnKeyType="next"
          textContentType="name"
          value={name}
        />
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
          autoComplete="new-password"
          editable={!isSubmitting && !isAuthBlocked}
          icon="lock"
          label="Password"
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          returnKeyType="done"
          secureTextEntry
          textContentType="newPassword"
          value={password}
        />
        <AppButton
          disabled={isSubmitting || isAuthBlocked}
          loading={isSubmitting}
          onPress={handleSignup}
        >
          Create account
        </AppButton>

        {!isAuthBlocked ? (
          <GoogleSignInButton
            disabled={isSubmitting}
            onError={handleGoogleError}
            onSuccess={() => trackEvent("signup_success_google")}
          />
        ) : null}

        <AppText tone="muted" variant="bodyMuted">
          Email signups are activated by a verification link sent to your inbox.
        </AppText>
      </AppCard>

      <View style={styles.footer}>
        <AppText tone="muted" variant="bodyMuted">
          Already have an account?
        </AppText>
        <HapticPressable onPress={() => navigation.navigate("Login")} hitSlop={10}>
          <AppText tone="primary" variant="button">
            Login
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
