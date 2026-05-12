import { StyleSheet, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";

export default function EmptyState({ action, icon = "info", message, title, style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.icon}>
        <AppIcon color={COLORS.primary} name={icon} size={30} />
      </View>
      <AppText style={styles.center} variant="cardTitle">
        {title}
      </AppText>
      {message ? (
        <AppText style={styles.center} tone="muted" variant="bodyMuted">
          {message}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: SPACING.md,
    padding: SPACING.xxl
  },
  center: {
    textAlign: "center"
  },
  icon: {
    alignItems: "center",
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.pill,
    height: 56,
    justifyContent: "center",
    width: 56
  }
});
