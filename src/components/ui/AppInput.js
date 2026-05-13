import { StyleSheet, TextInput, View } from "react-native";

import { RADIUS, SPACING, TYPOGRAPHY, useAppTheme } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";

export default function AppInput({ error, icon, inputStyle, label, multiline, style, ...props }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.field, style]}>
      {label ? <AppText variant="caption">{label}</AppText> : null}
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.danger : colors.inputBorder
          },
          multiline && styles.multilineShell
        ]}
      >
        {icon ? <AppIcon color={colors.muted} name={icon} size={18} /> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            { color: colors.text },
            multiline && styles.multilineInput,
            inputStyle
          ]}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          {...props}
        />
      </View>
      {error ? (
        <AppText tone="danger" variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: SPACING.sm
  },
  input: {
    ...TYPOGRAPHY.bodyStrong,
    flex: 1,
    minHeight: 48,
    paddingVertical: 0
  },
  inputShell: {
    alignItems: "center",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    minHeight: 52,
    paddingHorizontal: SPACING.lg
  },
  multilineInput: {
    minHeight: 112,
    paddingTop: SPACING.md
  },
  multilineShell: {
    alignItems: "flex-start",
    minHeight: 128
  }
});
