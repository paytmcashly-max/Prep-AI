import { StyleSheet, View } from "react-native";

import { COLORS, RADIUS, SPACING, useAppTheme } from "../../theme";
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
  const { colors } = useAppTheme();
  const toneColors = {
    default: colors.info,
    error: colors.danger,
    success: colors.success,
    warning: colors.warning
  };
  const iconColor = toneColors[tone] || TONE_COLOR[tone] || TONE_COLOR.default;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardAlt,
          borderColor: colors.border
        },
        tone === "error" && {
          backgroundColor: colors.dangerSoft,
          borderColor: colors.danger
        },
        tone === "success" && {
          backgroundColor: colors.successSoft,
          borderColor: colors.success
        },
        tone === "warning" && {
          backgroundColor: colors.warningSoft,
          borderColor: colors.warning
        },
        style
      ]}
    >
      <View
        style={[
          styles.iconBubble,
          {
            backgroundColor: colors.secondarySoft,
            borderColor: colors.border
          }
        ]}
      >
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
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.md,
    padding: SPACING.lg
  },
  copy: {
    flex: 1,
    gap: SPACING.xs
  },
  iconBubble: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    height: 36,
    justifyContent: "center",
    width: 36
  }
});
