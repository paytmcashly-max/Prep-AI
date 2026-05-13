import { useState } from "react";
import { StyleSheet, View } from "react-native";

import HapticPressable from "../components/HapticPressable";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppInput from "../components/ui/AppInput";
import AppText from "../components/ui/AppText";
import AuthScaffold from "../components/ui/AuthScaffold";
import MessageCard from "../components/ui/MessageCard";
import { trackEvent } from "../services/analyticsService";
import { signUpWithEmail } from "../services/authService";
import { SPACING } from "../theme";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignup = async () => {
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

        <AppInput
          autoCapitalize="words"
          autoComplete="name"
          editable={!isSubmitting}
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
          editable={!isSubmitting}
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
          editable={!isSubmitting}
          icon="lock"
          label="Password"
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          returnKeyType="done"
          secureTextEntry
          textContentType="newPassword"
          value={password}
        />
        <AppButton disabled={isSubmitting} loading={isSubmitting} onPress={handleSignup}>
          Create account
        </AppButton>
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
