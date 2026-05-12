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
import { signInWithEmail } from "../services/authService";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
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

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.shell}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <AppIcon color={COLORS.primary} name="target" size={20} />
          </View>
          <AppText variant="cardTitle">IntervueAI</AppText>
        </View>

        <View style={styles.header}>
          <AppText tone="primary" variant="caption">
            Welcome back
          </AppText>
          <AppText variant="screenTitle">Continue your preparation</AppText>
          <AppText tone="muted" variant="body">
            Pick up your interviews, resume checks, and progress exactly where you left off.
          </AppText>
        </View>

        <AppCard style={styles.formCard}>
          {errorMessage ? (
            <MessageCard message={errorMessage} title="Sign in failed" tone="error" />
          ) : null}

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
            autoComplete="password"
            editable={!isSubmitting}
            icon="lock"
            label="Password"
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            value={password}
          />

          <AppButton disabled={isSubmitting} loading={isSubmitting} onPress={handleLogin}>
            Login
          </AppButton>
        </AppCard>

        <View style={styles.footer}>
          <AppText tone="muted" variant="bodyMuted">
            New to IntervueAI?
          </AppText>
          <HapticPressable onPress={() => navigation.navigate("Signup")} hitSlop={10}>
            <AppText tone="primary" variant="button">
              Create an account
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
