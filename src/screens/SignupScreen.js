import { useState } from "react";
import { StyleSheet, View } from "react-native";

import HapticPressable from "../components/HapticPressable";
import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppIcon from "../components/ui/AppIcon";
import AppInput from "../components/ui/AppInput";
import AppText from "../components/ui/AppText";
import MessageCard from "../components/ui/MessageCard";
import { trackEvent } from "../services/analyticsService";
import { signUpWithEmail } from "../services/authService";
import { COLORS, RADIUS, SPACING } from "../theme";

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
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.shell}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <AppIcon color={COLORS.primary} name="target" size={20} />
          </View>
          <AppText variant="cardTitle">PrepAI</AppText>
        </View>

        <View style={styles.header}>
          <AppText tone="primary" variant="caption">
            Create account
          </AppText>
          <AppText variant="screenTitle">Start practicing with purpose</AppText>
          <AppText tone="muted" variant="body">
            Build an interview profile, save your sessions, and track the skills you are improving.
          </AppText>
        </View>

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
            value={email}
          />
          <AppInput
            autoComplete="new-password"
            editable={!isSubmitting}
            icon="lock"
            label="Password"
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
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
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  brandMark: {
    alignItems: "center",
    backgroundColor: COLORS.primarySoft,
    borderColor: "rgba(124, 109, 255, 0.35)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.screen
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    justifyContent: "center"
  },
  formCard: {
    gap: SPACING.lg
  },
  header: {
    gap: SPACING.sm
  },
  shell: {
    alignSelf: "center",
    gap: SPACING.xxl,
    maxWidth: 440,
    width: "100%"
  }
});
