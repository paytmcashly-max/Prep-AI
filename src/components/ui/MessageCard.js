import { StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../../theme";
import AppIcon from "./AppIcon";

const TONE_ICON = {
  default: "info",
  error: "error",
  success: "success",
  warning: "warning"
};

const TONE_COLOR = {
  default: COLORS.accent,
  error: COLORS.dangerSoft,
  success: COLORS.success,
  warning: COLORS.warning
};

export default function MessageCard({ children, message, title, tone = "default", style }) {
  const iconColor = TONE_COLOR[tone] || TONE_COLOR.default;

  return (
    <View style={[styles.card, tone === "error" && styles.errorCard, style]}>
      <AppIcon color={iconColor} name={TONE_ICON[tone] || TONE_ICON.default} />
      <View style={styles.copy}>
        {title ? (
          <Text selectable style={styles.title}>
            {title}
          </Text>
        ) : null}
        {message ? (
          <Text selectable style={[styles.message, tone === "error" && styles.errorText]}>
            {message}
          </Text>
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
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.base,
    padding: 14
  },
  copy: {
    flex: 1,
    gap: 5
  },
  errorCard: {
    borderColor: "rgba(239, 68, 68, 0.35)"
  },
  errorText: {
    color: COLORS.dangerSoft
  },
  message: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900"
  }
});
