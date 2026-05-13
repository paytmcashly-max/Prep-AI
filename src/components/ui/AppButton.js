import { ActivityIndicator, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import HapticPressable from "../HapticPressable";
import { PRESSED_STYLE, RADIUS, SPACING, useAppTheme } from "../../theme";
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
  const { colors, gradients } = useAppTheme();
  const isDisabled = disabled || loading;
  const toneStyle = TONE_STYLE[tone];
  const primaryContentColor = colors.primaryTextOnAccent;
  const secondaryContentColor = colors.text;
  const content = (
    <View style={styles.content}>
      {icon ? (
        <AppIcon
          color={tone === "primary" ? primaryContentColor : secondaryContentColor}
          name={icon}
          size={18}
        />
      ) : null}
      <AppText
        selectable={false}
        style={[
          styles.text,
          { color: tone === "primary" ? primaryContentColor : secondaryContentColor },
          textStyle
        ]}
        variant="button"
      >
        {children}
      </AppText>
      {rightIcon ? (
        <AppIcon
          color={tone === "primary" ? primaryContentColor : secondaryContentColor}
          name={rightIcon}
          size={18}
        />
      ) : null}
    </View>
  );

  return (
    <HapticPressable
      accessibilityRole="button"
      accessibilityState={{ busy: Boolean(loading), disabled: Boolean(isDisabled) }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        toneStyle && styles[toneStyle],
        tone === "danger" && {
          backgroundColor: colors.dangerSoft,
          borderColor: colors.danger
        },
        tone === "secondary" && {
          backgroundColor: colors.elevated,
          borderColor: colors.border
        },
        isDisabled && styles.disabled,
        pressed && !isDisabled && PRESSED_STYLE,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone === "primary" ? primaryContentColor : colors.text} />
      ) : tone === "primary" ? (
        <LinearGradient colors={gradients.primary} style={styles.gradient}>
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
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 50,
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
    minHeight: 50
  },
  secondaryButton: {
    borderWidth: 1
  },
  text: {
    textAlign: "center"
  }
});
