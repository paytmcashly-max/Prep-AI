import { StyleSheet, TextInput, View } from "react-native";

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";

export default function AppInput({ error, icon, inputStyle, label, multiline, style, ...props }) {
  return (
    <View style={[styles.field, style]}>
      {label ? <AppText variant="caption">{label}</AppText> : null}
      <View
        style={[styles.inputShell, multiline && styles.multilineShell, error && styles.errorShell]}
      >
        {icon ? <AppIcon color={COLORS.muted} name={icon} size={18} /> : null}
        <TextInput
          placeholderTextColor={COLORS.muted}
          style={[styles.input, multiline && styles.multilineInput, inputStyle]}
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
  errorShell: {
    borderColor: "rgba(251, 113, 133, 0.5)"
  },
  field: {
    gap: SPACING.sm
  },
  input: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
    flex: 1,
    minHeight: 54,
    paddingVertical: 0
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    minHeight: 56,
    paddingHorizontal: SPACING.lg
  },
  multilineInput: {
    minHeight: 132,
    paddingTop: SPACING.lg
  },
  multilineShell: {
    alignItems: "flex-start",
    minHeight: 150
  }
});
