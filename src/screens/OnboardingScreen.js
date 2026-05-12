import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import HapticPressable from "../components/HapticPressable";
import AppButton from "../components/ui/AppButton";
import AppIcon from "../components/ui/AppIcon";
import AppText from "../components/ui/AppText";
import Screen from "../components/ui/Screen";
import { COLORS, GRADIENTS, PRESSED_STYLE, RADIUS, SPACING } from "../theme";

const SLIDES = [
  {
    body: "Answer realistic interview questions, review your score, and improve one response at a time.",
    icon: "practice",
    metric: "5 Qs/day",
    title: "Practice with a calmer interview coach"
  },
  {
    body: "See what worked, what to tighten, and how to say the same answer with more confidence.",
    icon: "target",
    metric: "Clear feedback",
    title: "Turn every answer into a sharper one"
  },
  {
    body: "Upload or paste your resume to get ATS feedback, missing keywords, and lines you can adapt.",
    icon: "resume",
    metric: "Resume scan",
    title: "Prepare your profile before you apply"
  }
];

export default function OnboardingScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = SLIDES[activeIndex];
  const isLast = activeIndex === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      navigation.navigate("Signup");
      return;
    }

    setActiveIndex((current) => current + 1);
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <AppIcon color={COLORS.primary} name="target" size={18} />
          </View>
          <AppText variant="cardTitle">PrepAI</AppText>
        </View>
        <HapticPressable
          hitSlop={12}
          onPress={() => navigation.navigate("Login")}
          style={({ pressed }) => [styles.signIn, pressed && PRESSED_STYLE]}
        >
          <AppText tone="primary" variant="button">
            Sign in
          </AppText>
        </HapticPressable>
      </View>

      <View style={styles.heroWrap}>
        <LinearGradient colors={GRADIENTS.calm} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <AppIcon color={COLORS.text} name={slide.icon} size={34} />
            </View>
            <View style={styles.metricPill}>
              <AppText color="#FFFFFF" variant="caption">
                {slide.metric}
              </AppText>
            </View>
          </View>

          <View style={styles.previewStack}>
            <View style={styles.previewLineLong} />
            <View style={styles.previewLine} />
            <View style={styles.feedbackMini}>
              <AppIcon color={COLORS.success} name="success" size={18} />
              <AppText variant="caption">Actionable feedback</AppText>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.copy}>
        <AppText tone="primary" variant="caption">
          AI interview preparation
        </AppText>
        <AppText style={styles.title} variant="heroTitle">
          {slide.title}
        </AppText>
        <AppText style={styles.body} tone="muted" variant="body">
          {slide.body}
        </AppText>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((item, index) => (
            <View
              key={item.title}
              style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotIdle]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          {activeIndex > 0 ? (
            <AppButton
              icon="back"
              onPress={() => setActiveIndex((current) => current - 1)}
              tone="secondary"
            >
              Back
            </AppButton>
          ) : null}
          <AppButton rightIcon="next" onPress={next} style={styles.primaryAction}>
            {isLast ? "Create account" : "Continue"}
          </AppButton>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: SPACING.md
  },
  body: {
    textAlign: "center"
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: COLORS.primarySoft,
    borderColor: "rgba(124, 109, 255, 0.35)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  content: {
    justifyContent: "space-between"
  },
  copy: {
    alignItems: "center",
    gap: SPACING.md
  },
  dot: {
    borderRadius: RADIUS.pill,
    height: 8
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 34
  },
  dotIdle: {
    backgroundColor: COLORS.borderStrong,
    width: 8
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center"
  },
  feedbackMini: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm
  },
  footer: {
    gap: SPACING.xl
  },
  heroCard: {
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: SPACING.xxl,
    padding: SPACING.xl
  },
  heroHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(124, 109, 255, 0.32)",
    borderRadius: RADIUS.lg,
    height: 66,
    justifyContent: "center",
    width: 66
  },
  heroWrap: {
    gap: SPACING.lg
  },
  metricPill: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm
  },
  previewLine: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: RADIUS.pill,
    height: 14,
    width: "72%"
  },
  previewLineLong: {
    backgroundColor: "rgba(255, 255, 255, 0.28)",
    borderRadius: RADIUS.pill,
    height: 18,
    width: "100%"
  },
  previewStack: {
    gap: SPACING.md
  },
  primaryAction: {
    flex: 1
  },
  signIn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: SPACING.sm
  },
  title: {
    maxWidth: 360,
    textAlign: "center"
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
