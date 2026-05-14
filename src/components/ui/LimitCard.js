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
    <View style={styles.benefitItem}>
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
  const visibleBenefits = benefits.slice(0, 4);

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
            size={22}
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
            styles.syncBlock,
            {
              backgroundColor: colors.cardAlt,
              borderColor: colors.border
            }
          ]}
        >
          <View style={styles.sectionCopy}>
            <AppText variant="cardTitle">Finish syncing your plan</AppText>
            <AppText tone="muted" variant="bodyMuted">
              Premium starts after the backend confirms your payment or plan change.
            </AppText>
          </View>

          <View style={styles.actions}>
            <AppButton icon={primaryIcon} onPress={onUpgrade} style={styles.actionButton}>
              {primaryLabel}
            </AppButton>
          </View>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.countdownBlock,
              {
                backgroundColor: colors.cardAlt,
                borderColor: colors.borderStrong
              }
            ]}
          >
            <View style={styles.countdownLabelRow}>
              <AppIcon color={colors.muted} name="calendar" size={15} />
              <AppText tone="muted" variant="caption">
                {countdownLabel || "Free reset"}
              </AppText>
            </View>
            <AppText color={colors.primary} style={styles.countdownValue} variant="statNumber">
              {resetCountdown}
            </AppText>
            <AppText style={styles.countdownHelper} tone="muted" variant="bodyMuted">
              You can continue for free after this reset.
            </AppText>
          </View>

          {visibleBenefits.length ? (
            <View style={styles.benefitsBlock}>
              <AppText variant="cardTitle">Upgrade unlocks</AppText>
              <View style={styles.benefitList}>
                {visibleBenefits.map((benefit) => (
                  <BenefitItem key={benefit} label={benefit} />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            <AppButton icon={primaryIcon} onPress={onUpgrade} style={styles.actionButton}>
              {primaryLabel}
            </AppButton>
          </View>
        </>
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
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.sm
  },
  benefitList: {
    gap: SPACING.sm
  },
  benefitsBlock: {
    gap: SPACING.sm
  },
  benefitText: {
    flex: 1
  },
  card: {
    gap: SPACING.lg,
    overflow: "hidden"
  },
  copy: {
    flex: 1,
    gap: SPACING.xs,
    minWidth: 0
  },
  countdownBlock: {
    alignItems: "center",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md
  },
  countdownLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.xs,
    justifyContent: "center"
  },
  countdownHelper: {
    textAlign: "center"
  },
  countdownValue: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center"
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
    height: 50,
    justifyContent: "center",
    width: 50
  },
  sectionCopy: {
    gap: SPACING.xs
  },
  syncBlock: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: SPACING.md,
    padding: SPACING.md
  }
});
