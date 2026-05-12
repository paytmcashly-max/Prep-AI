import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS, GRADIENTS, RADIUS, SHADOWS, SPACING } from "../../theme";

export default function AppCard({ children, gradient, style, tone = "default" }) {
  const cardStyle = [
    styles.card,
    tone === "accent" && styles.accentCard,
    tone === "subtle" && styles.subtleCard,
    tone === "warning" && styles.warningCard,
    style
  ];

  if (gradient) {
    return (
      <LinearGradient colors={GRADIENTS[gradient] || GRADIENTS.calm} style={cardStyle}>
        {children}
      </LinearGradient>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  accentCard: {
    backgroundColor: COLORS.primarySoft,
    borderColor: "rgba(124, 109, 255, 0.45)"
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
    padding: SPACING.card,
    ...SHADOWS.card
  },
  subtleCard: {
    backgroundColor: COLORS.cardAlt
  },
  warningCard: {
    backgroundColor: COLORS.warningSoft,
    borderColor: "rgba(251, 191, 36, 0.35)"
  }
});
