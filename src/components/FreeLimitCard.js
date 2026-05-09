import { StyleSheet, Text, View } from "react-native";

import { DARK_COLORS } from "../theme";
import HapticPressable from "./HapticPressable";

const COLORS = DARK_COLORS;

const DEFAULT_BENEFITS = [
  "Unlimited practice",
  "Longer interviews: 10/15/20 questions",
  "More resume scans",
  "Priority AI feedback"
];

export default function FreeLimitCard({
  benefits = DEFAULT_BENEFITS,
  countdownLabel = "Resets in",
  message = "You have used today's free interview questions. Upgrade to Premium for unlimited practice or come back tomorrow.",
  onBack,
  onUpgrade,
  primaryLabel = "Upgrade to Premium",
  resetCountdown,
  secondaryLabel = "Back",
  title = "Daily free limit reached"
}) {
  return (
    <View style={styles.card}>
      <Text selectable style={styles.title}>
        {title}
      </Text>
      <Text selectable style={styles.message}>
        {message}
      </Text>
      <View style={styles.countdownBox}>
        <Text selectable style={styles.countdownLabel}>
          {countdownLabel}
        </Text>
        <Text selectable style={styles.countdownText}>
          {resetCountdown}
        </Text>
      </View>
      {benefits.length ? (
        <View style={styles.benefitList}>
          {benefits.map((benefit) => (
            <Text key={benefit} selectable style={styles.benefitText}>
              {"\u2022"} {benefit}
            </Text>
          ))}
        </View>
      ) : null}
      <HapticPressable
        onPress={onUpgrade}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
      </HapticPressable>
      {onBack ? (
        <HapticPressable
          onPress={onBack}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
        </HapticPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  benefitList: {
    gap: 8
  },
  benefitText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 22
  },
  countdownBox: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: "rgba(108, 99, 255, 0.35)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14
  },
  countdownLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  countdownText: {
    color: COLORS.accent,
    fontSize: 34,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 40
  },
  message: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23,
    textAlign: "center"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 16
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 33,
    textAlign: "center"
  }
});
