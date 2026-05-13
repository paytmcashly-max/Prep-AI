import { StyleSheet, View } from "react-native";

import { RADIUS, SPACING, useAppTheme } from "../../theme";
import AppButton from "./AppButton";
import AppCard from "./AppCard";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import Badge from "./Badge";

function BenefitItem({ label }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.benefitItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border
        }
      ]}
    >
      <AppIcon color={colors.success} name="check" size={15} />
      <AppText style={styles.benefitText} variant="bodyMuted">
        {label}
      </AppText>
    </View>
  );
}

export default function LimitCard({
  benefits = [],
  countdownLabel,
  message,
  onBack,
  onUpgrade,
  primaryLabel = "Upgrade to Premium",
  resetCountdown,
  secondaryLabel = "Back",
  style,
  title
}) {
  const { colors } = useAppTheme();
  const isSyncState = !resetCountdown && benefits.length === 0;
  const isRefreshAction = primaryLabel.toLowerCase().includes("refresh");
  const primaryIcon = isRefreshAction ? "refresh" : "premium";

  return (
    <AppCard gradient="calm" style={[styles.card, { borderColor: colors.borderStrong }, style]}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconBubble,
            {
              backgroundColor: isSyncState ? colors.secondarySoft : colors.primarySoft,
              borderColor: colors.borderStrong
            }
          ]}
        >
          <AppIcon
            color={isSyncState ? colors.secondary : colors.primary}
            name={isSyncState ? "refresh" : "lock"}
            size={20}
          />
        </View>
        <View style={styles.copy}>
          <Badge
            icon={isSyncState ? "refresh" : "timer"}
            label={isSyncState ? "Plan status" : "Free plan limit"}
          />
          <AppText variant="sectionTitle">{title}</AppText>
          <AppText tone="muted" variant="bodyMuted">
            {message}
          </AppText>
        </View>
      </View>

      {isSyncState ? (
        <View
          style={[
            styles.syncPanel,
            {
              backgroundColor: colors.cardAlt,
              borderColor: colors.border
            }
          ]}
        >
          <View style={styles.syncHeading}>
            <AppText variant="cardTitle">Finish syncing your plan</AppText>
            <AppText tone="muted" variant="bodyMuted">
              Premium starts only after the backend confirms your payment or plan change.
            </AppText>
          </View>

          <View style={styles.actions}>
            {onBack ? (
              <AppButton onPress={onBack} style={styles.actionButton} tone="secondary">
                {secondaryLabel}
              </AppButton>
            ) : null}
            <AppButton icon={primaryIcon} onPress={onUpgrade} style={styles.actionButton}>
              {primaryLabel}
            </AppButton>
          </View>
        </View>
      ) : (
        <View style={styles.optionStack}>
          <View
            style={[
              styles.optionPanel,
              {
                backgroundColor: colors.cardAlt,
                borderColor: colors.border
              }
            ]}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionTitleRow}>
                <AppIcon color={colors.muted} name="timer" size={16} />
                <AppText tone="muted" variant="caption">
                  Keep using Free
                </AppText>
              </View>
              <AppText variant="cardTitle">Wait for your next reset</AppText>
              <AppText tone="muted" variant="bodyMuted">
                Your free practice returns automatically when the countdown ends.
              </AppText>
            </View>

            {resetCountdown ? (
              <View
                style={[
                  styles.countdown,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.borderStrong
                  }
                ]}
              >
                <View style={styles.countdownMeta}>
                  <AppIcon color={colors.muted} name="calendar" size={15} />
                  <AppText tone="muted" variant="caption">
                    {countdownLabel}
                  </AppText>
                </View>
                <AppText color={colors.primary} style={styles.countdownValue} variant="monoNumber">
                  {resetCountdown}
                </AppText>
              </View>
            ) : null}

            {onBack ? (
              <AppButton onPress={onBack} style={styles.actionButton} tone="secondary">
                {secondaryLabel}
              </AppButton>
            ) : null}
          </View>

          <View
            style={[
              styles.optionPanel,
              styles.premiumPanel,
              {
                backgroundColor: colors.primarySoft,
                borderColor: colors.borderStrong
              }
            ]}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionTitleRow}>
                <AppIcon color={colors.primary} name="premium" size={16} />
                <AppText tone="primary" variant="caption">
                  Upgrade
                </AppText>
              </View>
              <AppText variant="cardTitle">Keep practicing right now</AppText>
              <AppText tone="muted" variant="bodyMuted">
                Unlock more sessions and continue without waiting for the next free reset.
              </AppText>
            </View>

            {benefits.length ? (
              <View style={styles.benefitsList}>
                {benefits.map((benefit) => (
                  <BenefitItem key={benefit} label={benefit} />
                ))}
              </View>
            ) : null}

            <AppButton icon={primaryIcon} onPress={onUpgrade} style={styles.actionButton}>
              {primaryLabel}
            </AppButton>
          </View>
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignSelf: "stretch"
  },
  actions: {
    gap: SPACING.sm
  },
  benefitItem: {
    alignItems: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    minHeight: 40,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm
  },
  benefitText: {
    flex: 1
  },
  benefitsList: {
    gap: SPACING.sm
  },
  card: {
    gap: SPACING.lg,
    overflow: "hidden"
  },
  copy: {
    flex: 1,
    gap: SPACING.sm,
    minWidth: 0
  },
  countdown: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md
  },
  countdownMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.xs
  },
  countdownValue: {
    fontSize: 24,
    lineHeight: 30
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.md
  },
  iconBubble: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  optionHeader: {
    gap: SPACING.xs
  },
  optionPanel: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
    padding: SPACING.md
  },
  optionStack: {
    gap: SPACING.md
  },
  optionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.xs
  },
  premiumPanel: {
    paddingBottom: SPACING.lg
  },
  syncHeading: {
    gap: SPACING.xs
  },
  syncPanel: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
    padding: SPACING.md
  }
});
