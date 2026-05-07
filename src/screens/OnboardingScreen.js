import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "../utils/constants";

const slides = [
  {
    eyebrow: "Mock interviews",
    title: "Practice the questions Indian recruiters actually ask",
    body: "Choose HR, technical, behavioral, or company-specific rounds and build confidence one answer at a time."
  },
  {
    eyebrow: "Instant AI feedback",
    title: "Know what worked and what needs polish",
    body: "Get a score, strengths, improvement points, and a better sample answer after each response."
  },
  {
    eyebrow: "Resume analyzer",
    title: "Tune your resume before you apply",
    body: "Upload a PDF and get ATS score, missing keywords, grammar fixes, and role-specific suggestions."
  }
];

export default function OnboardingScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === slides.length - 1;
  const activeSlide = slides[activeIndex];

  const progressLabel = useMemo(() => `${activeIndex + 1}/${slides.length}`, [activeIndex]);

  const handleNext = () => {
    if (isLastSlide) {
      navigation.navigate("Signup");
      return;
    }

    setActiveIndex((current) => current + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text selectable style={styles.progressText}>
          {progressLabel}
        </Text>
        <Pressable onPress={() => navigation.navigate("Login")} hitSlop={12}>
          <Text selectable style={styles.skipText}>
            Skip
          </Text>
        </Pressable>
      </View>

      <View style={styles.slide}>
        <View style={styles.illustration}>
          <View style={styles.phoneFrame}>
            <View style={styles.phoneHeader} />
            <View style={styles.questionLineLarge} />
            <View style={styles.questionLine} />
            <View style={styles.scoreRow}>
              <View style={styles.scorePill} />
              <View style={styles.scorePillMuted} />
            </View>
          </View>
        </View>

        <Text selectable style={styles.eyebrow}>
          {activeSlide.eyebrow}
        </Text>
        <Text selectable style={styles.title}>
          {activeSlide.title}
        </Text>
        <Text selectable style={styles.body}>
          {activeSlide.body}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.title}
              style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          {activeIndex > 0 ? (
            <Pressable
              onPress={() => setActiveIndex((current) => current - 1)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text selectable style={styles.secondaryButtonText}>
                Back
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text selectable style={styles.primaryButtonText}>
              {isLastSlide ? "Get started" : "Next"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 12
  },
  body: {
    color: COLORS.muted,
    fontSize: 17,
    lineHeight: 25,
    textAlign: "center"
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
    paddingBottom: 34,
    paddingTop: 58
  },
  dot: {
    borderRadius: 999,
    height: 8
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 30
  },
  dotInactive: {
    backgroundColor: COLORS.border,
    width: 8
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  footer: {
    gap: 26
  },
  illustration: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 230
  },
  phoneFrame: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 16,
    padding: 18,
    width: 210
  },
  phoneHeader: {
    alignSelf: "center",
    backgroundColor: COLORS.border,
    borderRadius: 999,
    height: 6,
    width: 58
  },
  pressed: {
    opacity: 0.82
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flex: 1,
    minHeight: 56,
    justifyContent: "center",
    paddingHorizontal: 18
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "800"
  },
  progressText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700"
  },
  questionLine: {
    backgroundColor: COLORS.border,
    borderRadius: 999,
    height: 12,
    width: "72%"
  },
  questionLineLarge: {
    backgroundColor: "#BFDBFE",
    borderRadius: 999,
    height: 16,
    width: "100%"
  },
  scorePill: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    height: 34,
    flex: 1
  },
  scorePillMuted: {
    backgroundColor: "#FED7AA",
    borderRadius: 999,
    height: 34,
    flex: 1
  },
  scoreRow: {
    flexDirection: "row",
    gap: 10
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 56,
    justifyContent: "center",
    paddingHorizontal: 22
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800"
  },
  skipText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800"
  },
  slide: {
    alignItems: "center",
    gap: 16
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 38,
    textAlign: "center"
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
