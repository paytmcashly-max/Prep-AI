import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import HapticPressable from "../HapticPressable";
import { COLORS, PRESSED_STYLE, RADIUS } from "../../theme";
import AppIcon from "./AppIcon";

export default function AppButton({
  children,
  disabled,
  icon,
  loading,
  onPress,
  style,
  textStyle,
  tone = "primary"
}) {
  const isDisabled = disabled || loading;

  return (
    <HapticPressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "secondary" && styles.secondaryButton,
        tone === "ghost" && styles.ghostButton,
        isDisabled && styles.disabled,
        pressed && !isDisabled && PRESSED_STYLE,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.text} />
      ) : (
        <View style={styles.content}>
          {icon ? <AppIcon name={icon} size={18} /> : null}
          <Text style={[styles.text, tone !== "primary" && styles.secondaryText, textStyle]}>
            {children}
          </Text>
        </View>
      )}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  disabled: {
    opacity: 0.55
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 0
  },
  secondaryButton: {
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderWidth: 1
  },
  secondaryText: {
    color: COLORS.text
  },
  text: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center"
  }
});
