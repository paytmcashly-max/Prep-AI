import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { RADIUS, SPACING, useAppTheme } from "../../theme";
import AppText from "./AppText";

export default function ScoreRing({ label = "Score", score, size = 132, suffix = "/100" }) {
  const { colors, gradients } = useAppTheme();
  const safeScore = Number.isFinite(Number(score)) ? Math.max(0, Math.min(100, Number(score))) : 0;
  const outerSize = Math.max(72, size);
  const innerSize = Math.max(60, outerSize - 14);
  const compact = outerSize < 110;

  return (
    <LinearGradient
      colors={gradients.score}
      style={[styles.outer, { height: outerSize, width: outerSize }]}
    >
      <View
        style={[
          styles.inner,
          { backgroundColor: colors.card, height: innerSize, width: innerSize }
        ]}
      >
        <AppText style={compact && styles.compactScore} variant="statNumber">
          {Math.round(safeScore)}
        </AppText>
        <AppText tone="muted" variant="caption">
          {label} {suffix}
        </AppText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  compactScore: {
    fontSize: 24,
    lineHeight: 30
  },
  inner: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    gap: SPACING.xs,
    justifyContent: "center"
  },
  outer: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    justifyContent: "center"
  }
});
