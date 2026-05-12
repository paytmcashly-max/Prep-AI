import { StyleSheet, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";

const TONE_ICON = {
  default: "info",
  error: "error",
  success: "success",
  warning: "warning"
};

const TONE_COLOR = {
  default: COLORS.info,
  error: COLORS.danger,
  success: COLORS.success,
  warning: COLORS.warning
};

export default function MessageCard({ children, message, title, tone = "default", style }) {
  const iconColor = TONE_COLOR[tone] || TONE_COLOR.default;

  return (
    <View
      style={[
        styles.card,
        tone === "error" && styles.errorCard,
        tone === "success" && styles.successCard,
        tone === "warning" && styles.warningCard,
        style
      ]}
    >
      <View style={styles.iconBubble}>
        <AppIcon color={iconColor} name={TONE_ICON[tone] || TONE_ICON.default} size={20} />
      </View>
      <View style={styles.copy}>
        {title ? <AppText variant="cardTitle">{title}</AppText> : null}
        {message ? (
          <AppText tone={tone === "error" ? "danger" : "muted"} variant="bodyMuted">
            {message}
          </AppText>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start",
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.md,
    padding: SPACING.lg
  },
  copy: {
    flex: 1,
    gap: SPACING.xs
  },
  errorCard: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: "rgba(251, 113, 133, 0.35)"
  },
  iconBubble: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  successCard: {
    backgroundColor: COLORS.successSoft,
    borderColor: "rgba(52, 211, 153, 0.32)"
  },
  warningCard: {
    backgroundColor: COLORS.warningSoft,
    borderColor: "rgba(251, 191, 36, 0.34)"
  }
});
