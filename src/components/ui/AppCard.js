import { StyleSheet, View } from "react-native";

import { COLORS, RADIUS, SHADOWS, SPACING } from "../../theme";

export default function AppCard({ children, style, tone = "default" }) {
  return (
    <View style={[styles.card, tone === "accent" && styles.accentCard, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  accentCard: {
    borderColor: "rgba(108, 99, 255, 0.45)"
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    padding: SPACING.card,
    ...SHADOWS.card
  }
});
