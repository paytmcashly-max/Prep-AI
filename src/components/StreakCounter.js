import { Text, View } from "react-native";

import { COLORS, SPACING } from "../utils/constants";

export default function StreakCounter({ days = 0 }) {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
        borderRadius: 8,
        borderWidth: 1,
        padding: SPACING.md
      }}
    >
      <Text
        selectable
        style={{
          color: COLORS.accent,
          fontSize: 30,
          fontVariant: ["tabular-nums"],
          fontWeight: "900"
        }}
      >
        {days}
      </Text>
      <Text selectable style={{ color: COLORS.muted, fontSize: 14, fontWeight: "700" }}>
        day streak
      </Text>
    </View>
  );
}
