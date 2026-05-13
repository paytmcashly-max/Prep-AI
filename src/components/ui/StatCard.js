import { StyleSheet, View } from "react-native";

import { RADIUS, SPACING, useAppTheme } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";

export default function StatCard({ icon, label, tone = "primary", value }) {
  const { colors } = useAppTheme();
  const iconColor =
    tone === "success" ? colors.success : tone === "warning" ? colors.warning : colors.secondary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border
        }
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.icon,
            {
              backgroundColor: colors.secondarySoft,
              borderColor: colors.border
            }
          ]}
        >
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
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    flex: 1,
    gap: SPACING.xs,
    minWidth: 96,
    padding: SPACING.md
  },
  icon: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    height: 30,
    justifyContent: "center",
    width: 30
  }
});
