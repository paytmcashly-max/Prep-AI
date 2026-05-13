import { StyleSheet } from "react-native";

import HapticPressable from "../HapticPressable";
import { PRESSED_STYLE, RADIUS, SPACING, useAppTheme } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import Stack from "./Stack";

export default function UploadCard({ disabled, helper, onPress, title }) {
  const { colors } = useAppTheme();

  return (
    <HapticPressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardAlt,
          borderColor: colors.border
        },
        disabled && styles.disabled,
        pressed && !disabled && PRESSED_STYLE
      ]}
    >
      <Stack align="center" gap="sm">
        <AppIcon color={colors.secondary} name="upload" size={30} />
        <AppText style={styles.center} variant="cardTitle">
          {title}
        </AppText>
        {helper ? (
          <AppText style={styles.center} tone="muted" variant="bodyMuted">
            {helper}
          </AppText>
        ) : null}
      </Stack>
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    borderStyle: "dashed",
    borderWidth: 1,
    minHeight: 132,
    padding: SPACING.xl
  },
  center: {
    textAlign: "center"
  },
  disabled: {
    opacity: 0.55
  }
});
