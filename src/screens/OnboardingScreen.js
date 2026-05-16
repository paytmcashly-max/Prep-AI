import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import HapticPressable from "../components/HapticPressable";
import AppButton from "../components/ui/AppButton";
import AppIcon from "../components/ui/AppIcon";
import AppText from "../components/ui/AppText";
import BrandMark from "../components/ui/BrandMark";
import Screen from "../components/ui/Screen";
import { PRESSED_STYLE, RADIUS, SPACING, useAppTheme } from "../theme";

const SLIDES = [
  {
    body: "Practice realistic rounds, get clear feedback, and build confidence before the real interview.",
    icon: "target",
    metric: "5 Qs/day",
    title: "Practice smarter. Interview better."
  },
  {
    body: "See what worked, what to tighten, and how to make each answer sharper.",
    icon: "target",
    metric: "Clear feedback",
    title: "Turn answers into coaching notes"
  },
  {
    body: "Upload your resume for ATS readiness, missing keywords, and practical rewrite suggestions.",
    icon: "resume",
    metric: "Resume scan",
    title: "Prepare your profile before applying"
  }
];

export default function OnboardingScreen({ navigation }) {
  const { colorScheme, colors, gradients } = useAppTheme();
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
          <BrandMark size="sm" />
          <AppText variant="cardTitle">IntervueAI</AppText>
        </View>
        <HapticPressable
          accessibilityLabel="Sign in"
          accessibilityRole="button"
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
        <LinearGradient colors={gradients.calm} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: colors.secondarySoft, borderColor: colors.border }
              ]}
            >
              <AppIcon color={colors.secondary} name={slide.icon} size={32} />
            </View>
            <View style={[styles.metricPill, { backgroundColor: colors.primarySoft }]}>
              <AppText color={colors.primary} variant="caption">
                {slide.metric}
              </AppText>
            </View>
          </View>

          <View style={styles.previewStack}>
            <View
              style={[
                styles.previewLineLong,
                {
                  backgroundColor:
                    colorScheme === "light" ? colors.borderStrong : colors.borderStrong
                }
              ]}
            />
            <View
              style={[
                styles.previewLine,
                {
                  backgroundColor: colorScheme === "light" ? colors.border : colors.border
                }
              ]}
            />
            <View
              style={[
                styles.feedbackMini,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <AppIcon color={colors.success} name="success" size={18} />
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
              style={[
                styles.dot,
                index === activeIndex
                  ? [styles.dotActive, { backgroundColor: colors.primary }]
                  : [styles.dotIdle, { backgroundColor: colors.borderStrong }]
              ]}
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
    maxWidth: 390,
    textAlign: "center"
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm
  },
  content: {
    gap: SPACING.xxl,
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
    width: 34
  },
  dotIdle: {
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
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    height: 66,
    justifyContent: "center",
    width: 66
  },
  heroWrap: {
    gap: SPACING.lg
  },
  metricPill: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm
  },
  previewLine: {
    borderRadius: RADIUS.pill,
    height: 14,
    width: "72%"
  },
  previewLineLong: {
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
