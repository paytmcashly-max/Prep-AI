import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS, GRADIENTS, RADIUS, SPACING } from "../../theme";
import AppText from "./AppText";

export default function ScoreRing({ label = "Score", score, suffix = "/100" }) {
  const safeScore = Number.isFinite(Number(score)) ? Math.max(0, Math.min(100, Number(score))) : 0;

  return (
    <LinearGradient colors={GRADIENTS.score} style={styles.outer}>
      <View style={styles.inner}>
        <AppText variant="statNumber">{Math.round(safeScore)}</AppText>
        <AppText tone="muted" variant="caption">
          {label} {suffix}
        </AppText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.pill,
    gap: SPACING.xs,
    height: 118,
    justifyContent: "center",
    width: 118
  },
  outer: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    height: 132,
    justifyContent: "center",
    width: 132
  }
});
