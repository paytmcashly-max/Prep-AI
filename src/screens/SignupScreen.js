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

import { signUpWithEmail } from "../services/authService";
import HapticPressable from "../components/HapticPressable";
import { trackEvent } from "../services/analyticsService";
import { COLORS } from "../utils/constants";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Missing details", "Please enter your name, email, and password.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Weak password", "Please use at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    trackEvent("signup_started");

    try {
      await signUpWithEmail(name, email, password);
    } catch (error) {
      Alert.alert("Signup failed", error.message || "Please try again.");
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
          <Text selectable style={styles.eyebrow}>
            Start free
          </Text>
          <Text selectable style={styles.title}>
            Create your PrepAI account
          </Text>
          <Text selectable style={styles.subtitle}>
            Set up your profile and get practice questions matched to your target role.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text selectable style={styles.label}>
              Full name
            </Text>
            <TextInput
              autoCapitalize="words"
              autoComplete="name"
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              value={name}
            />
          </View>

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
              autoComplete="new-password"
              onChangeText={setPassword}
              placeholder="Create a password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              style={styles.input}
              value={password}
            />
            <Text selectable style={styles.helperText}>
              Use at least 8 characters for a stronger account.
            </Text>
          </View>

          <HapticPressable
            disabled={isSubmitting}
            onPress={handleSignup}
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
                Create account
              </Text>
            )}
          </HapticPressable>
        </View>

        <View style={styles.footerRow}>
          <Text selectable style={styles.footerText}>
            Already have an account?
          </Text>
          <HapticPressable onPress={() => navigation.navigate("Login")} hitSlop={10}>
            <Text selectable style={styles.footerLink}>
              Login
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
    flexWrap: "wrap",
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
  helperText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19
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
