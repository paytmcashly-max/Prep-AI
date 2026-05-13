import { StyleSheet, View } from "react-native";

import HapticPressable from "../HapticPressable";
import { PRESSED_STYLE, RADIUS, SPACING, useAppTheme } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";

export default function ListRow({ detail, destructive, icon, label, onPress, right }) {
  const { colors } = useAppTheme();
  const iconColor = destructive ? colors.danger : colors.secondary;

  return (
    <HapticPressable
      disabled={!onPress && !right}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.row,
          borderColor: colors.border
        },
        pressed && onPress && PRESSED_STYLE
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.icon,
            {
              backgroundColor: destructive ? colors.dangerSoft : colors.secondarySoft,
              borderColor: colors.border
            }
          ]}
        >
          <AppIcon color={iconColor} name={icon} size={19} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <AppText tone={destructive ? "danger" : "default"} variant="bodyStrong">
          {label}
        </AppText>
        {detail ? (
          <AppText tone="muted" variant="bodyMuted">
            {detail}
          </AppText>
        ) : null}
      </View>
      {right || (onPress ? <AppIcon color={colors.muted} name="next" size={18} /> : null)}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: SPACING.xs,
    minWidth: 0
  },
  icon: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  row: {
    alignItems: "center",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.md,
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm
  }
});
