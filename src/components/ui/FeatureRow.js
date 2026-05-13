import { StyleSheet, View } from "react-native";

import { SPACING, useAppTheme } from "../../theme";
import AppIcon from "./AppIcon";
import AppText from "./AppText";

export default function FeatureRow({ available = true, label, note }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.icon, !available && styles.iconMuted]}>
        <AppIcon
          color={available ? colors.success : colors.muted}
          name={available ? "check" : "lock"}
          size={16}
          strokeWidth={2.7}
        />
      </View>
      <View style={styles.copy}>
        <AppText variant="bodyStrong">{label}</AppText>
        {note ? (
          <AppText tone="muted" variant="bodyMuted">
            {note}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    width: 24
  },
  iconMuted: {
    opacity: 0.8
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.sm
  }
});
