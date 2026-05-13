import { StyleSheet, View } from "react-native";

import { RADIUS, SPACING, useAppTheme } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";

export default function EmptyState({ action, icon = "info", message, title, style }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardAlt,
          borderColor: colors.border
        },
        style
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            backgroundColor: colors.secondarySoft,
            borderColor: colors.border
          }
        ]}
      >
        <AppIcon color={colors.secondary} name={icon} size={30} />
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
    borderRadius: RADIUS.xl,
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
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    height: 56,
    justifyContent: "center",
    width: 56
  }
});
