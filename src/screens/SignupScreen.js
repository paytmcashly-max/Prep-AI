import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HapticPressable from "../components/HapticPressable";
import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import AppIcon from "../components/ui/AppIcon";
import { signUpWithEmail } from "../services/authService";
import { trackEvent } from "../services/analyticsService";
import { getThemeColors } from "../theme";

export default function SignupScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(colorScheme), [colorScheme]);
  const isLightMode = colorScheme === "light";
  const styles = useMemo(() => createStyles(colors, isLightMode), [colors, isLightMode]);
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const isCompact = height < 740 || width < 370;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignup = async () => {
    setErrorMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Please enter your name, email, and password.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    trackEvent("signup_started");

    try {
      await signUpWithEmail(name, email, password);
    } catch (error) {
      setErrorMessage(error.message || "Signup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            minHeight: height,
            paddingBottom: Math.max(insets.bottom + 20, 32),
            paddingTop: Math.max(insets.top + 14, 34)
          }
        ]}
      >
        <View style={styles.shell}>
          <View style={styles.topBar}>
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <AppIcon color={colors.accent} name="target" size={18} />
              </View>
              <Text selectable style={styles.brandText}>
                PrepAI
              </Text>
            </View>
            <HapticPressable
              hitSlop={12}
              onPress={() => navigation.navigate("Login")}
              style={({ pressed }) => [styles.topLink, pressed && styles.pressed]}
            >
              <Text selectable style={styles.topLinkText}>
                Login
              </Text>
            </HapticPressable>
          </View>

          <View style={styles.header}>
            <Text selectable style={styles.eyebrow}>
              Get started
            </Text>
            <Text selectable style={[styles.title, isCompact && styles.titleCompact]}>
              Create your account
            </Text>
            <Text selectable style={styles.subtitle}>
              Save your profile, practice sessions, resume checks, and progress in one place.
            </Text>
          </View>

          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorCard}>
                <AppIcon color={colors.danger} name="warning" size={18} />
                <Text selectable style={styles.errorText}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text selectable style={styles.label}>
                Full name
              </Text>
              <View style={styles.inputShell}>
                <AppIcon color={colors.muted} name="user" size={18} />
                <TextInput
                  autoCapitalize="words"
                  autoComplete="name"
                  editable={!isSubmitting}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={name}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text selectable style={styles.label}>
                Email
              </Text>
              <View style={styles.inputShell}>
                <AppIcon color={colors.muted} name="mail" size={18} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isSubmitting}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={email}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text selectable style={styles.label}>
                Password
              </Text>
              <View style={styles.inputShell}>
                <AppIcon color={colors.muted} name="lock" size={18} />
                <TextInput
                  autoComplete="new-password"
                  editable={!isSubmitting}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>
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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text selectable style={styles.primaryButtonText}>
                  Create account
                </Text>
              )}
            </HapticPressable>
          </View>

          <View style={styles.footer}>
            <Text selectable style={styles.footerText}>
              Already have an account?
            </Text>
            <HapticPressable onPress={() => navigation.navigate("Login")} hitSlop={10}>
              <Text selectable style={styles.footerLink}>
                Login
              </Text>
            </HapticPressable>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const createStyles = (colors, isLightMode) =>
  StyleSheet.create({
    brand: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10
    },
    brandMark: {
      alignItems: "center",
      backgroundColor: isLightMode ? "#EEF0FF" : "rgba(108, 99, 255, 0.14)",
      borderColor: isLightMode ? "#D8DBFF" : "rgba(108, 99, 255, 0.32)",
      borderRadius: 14,
      borderWidth: 1,
      height: 40,
      justifyContent: "center",
      width: 40
    },
    brandText: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "900"
    },
    buttonDisabled: {
      backgroundColor: isLightMode ? "#A7AFBF" : "#343A46"
    },
    container: {
      backgroundColor: colors.background,
      flex: 1
    },
    content: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 22
    },
    errorCard: {
      alignItems: "flex-start",
      backgroundColor: isLightMode ? "#FEF2F2" : "rgba(239, 68, 68, 0.12)",
      borderColor: isLightMode ? "#FECACA" : "rgba(239, 68, 68, 0.28)",
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: "row",
      gap: 9,
      padding: 12
    },
    errorText: {
      color: isLightMode ? "#991B1B" : "#FCA5A5",
      flex: 1,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 20
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 0,
      textTransform: "uppercase"
    },
    field: {
      gap: 8
    },
    footer: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
      justifyContent: "center"
    },
    footerLink: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: "900"
    },
    footerText: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "700"
    },
    formCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 22,
      borderWidth: 1,
      gap: 17,
      padding: 20
    },
    header: {
      gap: 9
    },
    input: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      minHeight: 52,
      paddingVertical: 0
    },
    inputShell: {
      alignItems: "center",
      backgroundColor: isLightMode ? "#F8FAFC" : colors.cardAlt,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: "row",
      gap: 10,
      minHeight: 56,
      paddingHorizontal: 14
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "900"
    },
    pressed: {
      opacity: 0.82,
      transform: [{ scale: 0.99 }]
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 15,
      justifyContent: "center",
      minHeight: 56,
      paddingHorizontal: 18
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900"
    },
    shell: {
      alignSelf: "center",
      gap: 24,
      maxWidth: 430,
      width: "100%"
    },
    subtitle: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 24
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: "900",
      letterSpacing: 0,
      lineHeight: 40
    },
    titleCompact: {
      fontSize: 30,
      lineHeight: 36
    },
    topBar: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between"
    },
    topLink: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: 4
    },
    topLinkText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "900"
    }
  });
