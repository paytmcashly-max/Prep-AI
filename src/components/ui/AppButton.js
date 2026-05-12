import { ActivityIndicator, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import HapticPressable from "../HapticPressable";
import { COLORS, GRADIENTS, PRESSED_STYLE, RADIUS, SPACING } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";

const TONE_STYLE = {
  danger: "dangerButton",
  ghost: "ghostButton",
  secondary: "secondaryButton"
};

export default function AppButton({
  children,
  disabled,
  icon,
  loading,
  onPress,
  rightIcon,
  style,
  textStyle,
  tone = "primary"
}) {
  const isDisabled = disabled || loading;
  const toneStyle = TONE_STYLE[tone];
  const content = (
    <View style={styles.content}>
      {icon ? (
        <AppIcon color={tone === "primary" ? "#FFFFFF" : COLORS.text} name={icon} size={18} />
      ) : null}
      <AppText
        selectable={false}
        style={[styles.text, tone !== "primary" && styles.secondaryText, textStyle]}
        variant="button"
      >
        {children}
      </AppText>
      {rightIcon ? (
        <AppIcon color={tone === "primary" ? "#FFFFFF" : COLORS.text} name={rightIcon} size={18} />
      ) : null}
    </View>
  );

  return (
    <HapticPressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        toneStyle && styles[toneStyle],
        isDisabled && styles.disabled,
        pressed && !isDisabled && PRESSED_STYLE,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone === "primary" ? "#FFFFFF" : COLORS.text} />
      ) : tone === "primary" ? (
        <LinearGradient colors={GRADIENTS.primary} style={styles.gradient}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: RADIUS.md,
    justifyContent: "center",
    minHeight: 54,
    overflow: "hidden"
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg
  },
  dangerButton: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: "rgba(251, 113, 133, 0.35)",
    borderWidth: 1
  },
  disabled: {
    opacity: 0.62
  },
  ghostButton: {
    backgroundColor: "transparent"
  },
  gradient: {
    alignItems: "center",
    alignSelf: "stretch",
    flex: 1,
    justifyContent: "center",
    minHeight: 54
  },
  secondaryButton: {
    backgroundColor: COLORS.elevated,
    borderColor: COLORS.border,
    borderWidth: 1
  },
  secondaryText: {
    color: COLORS.text
  },
  text: {
    color: "#FFFFFF",
    textAlign: "center"
  }
});
