import { StyleSheet } from "react-native";

import HapticPressable from "../HapticPressable";
import { PRESSED_STYLE, RADIUS, useAppTheme } from "../../theme";
import AppIcon from "./AppIcon";

export default function IconButton({
  accessibilityLabel,
  disabled,
  icon,
  onPress,
  size = 44,
  style
}) {
  const { colors } = useAppTheme();

  return (
    <HapticPressable
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.cardAlt,
          borderColor: colors.border,
          height: size,
          width: size
        },
        disabled && styles.disabled,
        pressed && !disabled && PRESSED_STYLE,
        style
      ]}
    >
      <AppIcon color={disabled ? colors.disabledText : colors.text} name={icon} size={20} />
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    justifyContent: "center"
  },
  disabled: {
    opacity: 0.55
  }
});
