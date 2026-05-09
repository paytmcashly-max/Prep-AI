import { StyleSheet, Text, View } from "react-native";

import { DARK_COLORS, ICON_SIZES } from "../theme";
import AppButton from "./ui/AppButton";
import AppCard from "./ui/AppCard";
import AppIcon from "./ui/AppIcon";

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
    <AppCard style={styles.card}>
      <View style={styles.iconBubble}>
        <AppIcon color={COLORS.warning} name="warning" size={ICON_SIZES.card} />
      </View>
      <View style={styles.headerCopy}>
        <Text selectable style={styles.title}>
          {title}
        </Text>
        <Text selectable style={styles.message}>
          {message}
        </Text>
      </View>
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
            <View key={benefit} style={styles.benefitRow}>
              <AppIcon color={COLORS.accent} name="check" size={16} strokeWidth={2.6} />
              <Text selectable style={styles.benefitText}>
                {benefit}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <AppButton icon="premium" onPress={onUpgrade}>
        {primaryLabel}
      </AppButton>
      {onBack ? (
        <AppButton onPress={onBack} tone="secondary">
          {secondaryLabel}
        </AppButton>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  benefitList: {
    gap: 8
  },
  benefitRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  benefitText: {
    color: COLORS.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  },
  headerCopy: {
    gap: 10
  },
  iconBubble: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(250, 204, 21, 0.12)",
    borderColor: "rgba(250, 204, 21, 0.35)",
    borderRadius: 999,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  card: {
    gap: 14,
    padding: 18
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
    fontSize: 30,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 36,
    textAlign: "center"
  },
  message: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23,
    textAlign: "center"
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 31,
    textAlign: "center"
  }
});
