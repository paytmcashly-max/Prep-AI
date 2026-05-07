import { Text, View } from "react-native";

import { COLORS, SPACING } from "../utils/constants";

export default function ScoreGraph({ scores = [6, 7, 8, 7, 9] }) {
  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: SPACING.md,
        padding: SPACING.md
      }}
    >
      <Text selectable style={{ color: COLORS.text, fontSize: 18, fontWeight: "800" }}>
        Weekly score
      </Text>
      <View style={{ flexDirection: "row", gap: SPACING.sm, height: 120, alignItems: "flex-end" }}>
        {scores.map((score, index) => (
          <View key={`${score}-${index}`} style={{ alignItems: "center", flex: 1, gap: SPACING.xs }}>
            <View
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 6,
                height: `${Math.max(score * 10, 8)}%`,
                width: "100%"
              }}
            />
            <Text selectable style={{ color: COLORS.muted, fontSize: 12, fontVariant: ["tabular-nums"] }}>
              {score}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
