import { StyleSheet, View } from "react-native";

import { RADIUS, SPACING, useAppTheme } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";

export default function Badge({ icon, label, tone = "default", style }) {
  const { colors } = useAppTheme();
  const toneColor =
    tone === "success"
      ? colors.success
      : tone === "warning"
        ? colors.warning
        : tone === "danger"
          ? colors.danger
          : colors.secondary;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.secondarySoft,
          borderColor: colors.border
        },
        style
      ]}
    >
      {icon ? <AppIcon color={toneColor} name={icon} size={14} /> : null}
      <AppText color={toneColor} selectable={false} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.xs,
    minHeight: 28,
    paddingHorizontal: SPACING.sm
  }
});
