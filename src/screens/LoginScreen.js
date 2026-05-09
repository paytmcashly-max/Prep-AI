import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { signInWithEmail } from "../services/authService";
import AppIcon from "../components/ui/AppIcon";
import HapticPressable from "../components/HapticPressable";
import { trackEvent } from "../services/analyticsService";
import { COLORS } from "../theme";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmail(email, password);
      trackEvent("login_success");
    } catch (error) {
      Alert.alert("Login failed", error.message || "Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onTouchStart={Keyboard.dismiss}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.heroIcon}>
            <AppIcon color={COLORS.accent} name="user" size={34} />
          </View>
          <Text selectable style={styles.eyebrow}>
            Welcome back
          </Text>
          <Text selectable style={styles.title}>
            Login to continue your prep
          </Text>
          <Text selectable style={styles.subtitle}>
            Keep your streak alive and jump back into mock interviews.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text selectable style={styles.label}>
              Email
            </Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              value={email}
            />
          </View>

          <View style={styles.field}>
            <Text selectable style={styles.label}>
              Password
            </Text>
            <TextInput
              autoComplete="password"
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>

          <HapticPressable
            disabled={isSubmitting}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.primaryButton,
              isSubmitting && styles.buttonDisabled,
              pressed && !isSubmitting && styles.pressed
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text selectable style={styles.primaryButtonText}>
                Login
              </Text>
            )}
          </HapticPressable>
        </View>

        <View style={styles.footerRow}>
          <Text selectable style={styles.footerText}>
            New to PrepAI?
          </Text>
          <HapticPressable onPress={() => navigation.navigate("Signup")} hitSlop={10}>
            <Text selectable style={styles.footerLink}>
              Create account
            </Text>
          </HapticPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1
  },
  buttonDisabled: {
    backgroundColor: "#94A3B8"
  },
  content: {
    flexGrow: 1,
    gap: 32,
    justifyContent: "center",
    padding: 24
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  field: {
    gap: 8
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800"
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    justifyContent: "center"
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "600"
  },
  form: {
    gap: 18
  },
  header: {
    gap: 10
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(108, 99, 255, 0.12)",
    borderColor: "rgba(108, 99, 255, 0.3)",
    borderRadius: 999,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16
  },
  keyboardView: {
    flex: 1
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.82
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 18
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "900"
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 16,
    lineHeight: 24
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 39
  }
});
