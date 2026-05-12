import { StyleSheet, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";

export default function StatCard({ icon, label, tone = "primary", value }) {
  const iconColor =
    tone === "success" ? COLORS.success : tone === "warning" ? COLORS.warning : COLORS.primary;

  return (
    <View style={styles.card}>
      {icon ? (
        <View style={styles.icon}>
          <AppIcon color={iconColor} name={icon} size={20} />
        </View>
      ) : null}
      <AppText variant="statNumber">{value}</AppText>
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flex: 1,
    gap: SPACING.xs,
    minWidth: 104,
    padding: SPACING.lg
  },
  icon: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.pill,
    height: 32,
    justifyContent: "center",
    width: 32
  }
});
