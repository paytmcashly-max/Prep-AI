import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { RADIUS, SHADOWS, SPACING, useAppTheme } from "../../theme";

export default function AppCard({ children, gradient, style, tone = "default" }) {
  const { colors, gradients } = useAppTheme();
  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.border
    },
    tone === "accent" && {
      backgroundColor: colors.primarySoft,
      borderColor: colors.borderStrong
    },
    tone === "subtle" && {
      backgroundColor: colors.cardAlt,
      borderColor: colors.border
    },
    tone === "warning" && {
      backgroundColor: colors.warningSoft,
      borderColor: colors.warning
    },
    style
  ];

  if (gradient) {
    return (
      <LinearGradient colors={gradients[gradient] || gradients.calm} style={cardStyle}>
        {children}
      </LinearGradient>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.card,
    ...SHADOWS.card
  }
});
