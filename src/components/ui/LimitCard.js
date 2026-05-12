import { StyleSheet, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../../theme";
import AppButton from "./AppButton";
import AppCard from "./AppCard";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import FeatureRow from "./FeatureRow";

export default function LimitCard({
  benefits = [],
  countdownLabel,
  message,
  onBack,
  onUpgrade,
  primaryLabel = "Upgrade to Premium",
  resetCountdown,
  secondaryLabel = "Back",
  title
}) {
  return (
    <AppCard style={styles.card} tone="warning">
      <View style={styles.iconBubble}>
        <AppIcon color={COLORS.warning} name="warning" size={24} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.center} variant="sectionTitle">
          {title}
        </AppText>
        <AppText style={styles.center} tone="muted" variant="body">
          {message}
        </AppText>
      </View>
      {resetCountdown ? (
        <View style={styles.countdown}>
          <AppText tone="muted" variant="caption">
            {countdownLabel}
          </AppText>
          <AppText color={COLORS.warning} style={styles.countdownValue} variant="monoNumber">
            {resetCountdown}
          </AppText>
        </View>
      ) : null}
      {benefits.length ? (
        <View style={styles.benefits}>
          {benefits.map((benefit) => (
            <FeatureRow key={benefit} label={benefit} />
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
  benefits: {
    gap: SPACING.sm
  },
  card: {
    gap: SPACING.lg
  },
  center: {
    textAlign: "center"
  },
  copy: {
    gap: SPACING.sm
  },
  countdown: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: "rgba(251, 191, 36, 0.34)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md
  },
  countdownValue: {
    fontSize: 28,
    lineHeight: 34
  },
  iconBubble: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: COLORS.warningSoft,
    borderColor: "rgba(251, 191, 36, 0.35)",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50
  }
});
