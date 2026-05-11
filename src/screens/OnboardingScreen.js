import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HapticPressable from "../components/HapticPressable";
import AppIcon from "../components/ui/AppIcon";
import { getThemeColors } from "../theme";

const slides = [
  {
    eyebrow: "Mock interviews",
    icon: "practice",
    metric: "5 Qs",
    previewTitle: "HR round",
    title: "Practice interviews without feeling lost",
    body: "Choose a round, answer one question at a time, and build confidence with a clear practice flow."
  },
  {
    eyebrow: "Clear feedback",
    icon: "target",
    metric: "Score",
    previewTitle: "Answer review",
    title: "Know what worked and what to improve",
    body: "Get a score, strengths, short improvement points, and a better way to frame your answer."
  },
  {
    eyebrow: "Resume analyzer",
    icon: "resume",
    metric: "ATS",
    previewTitle: "Resume scan",
    title: "Tune your resume before you apply",
    body: "Review your ATS score, missing keywords, grammar issues, and practical lines you can adapt."
  }
];

export default function OnboardingScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(colorScheme), [colorScheme]);
  const isLightMode = colorScheme === "light";
  const styles = useMemo(() => createStyles(colors, isLightMode), [colors, isLightMode]);
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === slides.length - 1;
  const activeSlide = slides[activeIndex];
  const isCompact = height < 720 || width < 370;

  const progressLabel = useMemo(() => `${activeIndex + 1} of ${slides.length}`, [activeIndex]);

  const handleNext = () => {
    if (isLastSlide) {
      navigation.navigate("Signup");
      return;
    }

    setActiveIndex((current) => current + 1);
  };

  return (
    <View style={styles.root}>
      <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            minHeight: height,
            paddingBottom: Math.max(insets.bottom + 18, 30),
            paddingTop: Math.max(insets.top + 14, 34)
          }
        ]}
      >
        <View style={styles.topBar}>
          <View style={styles.progressPill}>
            <Text selectable style={styles.progressText}>
              {progressLabel}
            </Text>
          </View>
          <HapticPressable
            onPress={() => navigation.navigate("Login")}
            hitSlop={12}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
          >
            <Text selectable style={styles.skipText}>
              Sign in
            </Text>
          </HapticPressable>
        </View>

        <View style={[styles.hero, isCompact && styles.heroCompact]}>
          <View style={styles.heroIcon}>
            <AppIcon color={colors.accent} name={activeSlide.icon} size={isCompact ? 34 : 42} />
          </View>

          <View style={styles.previewPanel}>
            <View style={styles.previewHeader}>
              <View>
                <Text selectable style={styles.previewEyebrow}>
                  PrepAI
                </Text>
                <Text selectable style={styles.previewTitle}>
                  {activeSlide.previewTitle}
                </Text>
              </View>
              <View style={styles.metricPill}>
                <Text selectable style={styles.metricText}>
                  {activeSlide.metric}
                </Text>
              </View>
            </View>
            <View style={styles.previewLineStrong} />
            <View style={styles.previewLine} />
            <View style={styles.previewLineShort} />
          </View>
        </View>

        <View style={styles.copy}>
          <Text selectable style={styles.eyebrow}>
            {activeSlide.eyebrow}
          </Text>
          <Text selectable style={[styles.title, isCompact && styles.titleCompact]}>
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
              <HapticPressable
                onPress={() => setActiveIndex((current) => current - 1)}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <AppIcon color={colors.text} name="back" size={18} />
                <Text selectable style={styles.secondaryButtonText}>
                  Back
                </Text>
              </HapticPressable>
            ) : null}

            <HapticPressable
              onPress={handleNext}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text selectable style={styles.primaryButtonText}>
                {isLastSlide ? "Get started" : "Continue"}
              </Text>
              <AppIcon color="#FFFFFF" name="next" size={18} />
            </HapticPressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors, isLightMode) =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      gap: 12
    },
    body: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 24,
      textAlign: "center"
    },
    container: {
      backgroundColor: colors.background,
      flex: 1
    },
    content: {
      flexGrow: 1,
      gap: 28,
      justifyContent: "space-between",
      paddingHorizontal: 22
    },
    copy: {
      alignItems: "center",
      gap: 12
    },
    dot: {
      borderRadius: 999,
      height: 8
    },
    dotActive: {
      backgroundColor: colors.accent,
      width: 34
    },
    dotInactive: {
      backgroundColor: colors.border,
      width: 8
    },
    dots: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      justifyContent: "center"
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 0,
      textTransform: "uppercase"
    },
    footer: {
      gap: 22
    },
    hero: {
      alignItems: "center",
      gap: 18
    },
    heroCompact: {
      gap: 14
    },
    heroIcon: {
      alignItems: "center",
      backgroundColor: isLightMode ? "#ECEEFF" : "rgba(108, 99, 255, 0.14)",
      borderColor: isLightMode ? "#D7DAFF" : "rgba(108, 99, 255, 0.35)",
      borderRadius: 999,
      borderWidth: 1,
      height: 82,
      justifyContent: "center",
      width: 82
    },
    metricPill: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7
    },
    metricText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900"
    },
    previewEyebrow: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    previewHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: 14,
      justifyContent: "space-between"
    },
    previewLine: {
      backgroundColor: colors.border,
      borderRadius: 999,
      height: 12,
      width: "76%"
    },
    previewLineShort: {
      backgroundColor: colors.border,
      borderRadius: 999,
      height: 12,
      width: "54%"
    },
    previewLineStrong: {
      backgroundColor: isLightMode ? "#DADDFD" : "rgba(108, 99, 255, 0.28)",
      borderRadius: 999,
      height: 16,
      width: "100%"
    },
    previewPanel: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 22,
      borderWidth: 1,
      gap: 16,
      maxWidth: 340,
      padding: 20,
      width: "100%"
    },
    previewTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
      lineHeight: 24
    },
    pressed: {
      opacity: 0.82,
      transform: [{ scale: 0.99 }]
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 16,
      flex: 1,
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      minHeight: 58,
      paddingHorizontal: 18
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900"
    },
    progressPill: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8
    },
    progressText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "900"
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    secondaryButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: 7,
      justifyContent: "center",
      minHeight: 58,
      paddingHorizontal: 18
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900"
    },
    skipButton: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: 6
    },
    skipText: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: "900"
    },
    title: {
      color: colors.text,
      fontSize: 31,
      fontWeight: "900",
      letterSpacing: 0,
      lineHeight: 38,
      maxWidth: 360,
      textAlign: "center"
    },
    titleCompact: {
      fontSize: 28,
      lineHeight: 35
    },
    topBar: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between"
    }
  });
