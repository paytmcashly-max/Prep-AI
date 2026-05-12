import { StyleSheet, View } from "react-native";

import { SPACING } from "../../theme";
import AppText from "./AppText";

export default function SectionHeader({ action, eyebrow, subtitle, title, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.copy}>
        {eyebrow ? (
          <AppText tone="primary" variant="caption">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="sectionTitle">{title}</AppText>
        {subtitle ? (
          <AppText tone="muted" variant="bodyMuted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: SPACING.xs
  },
  wrap: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.md,
    justifyContent: "space-between"
  }
});
