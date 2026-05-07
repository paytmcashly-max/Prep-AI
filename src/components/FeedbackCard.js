import { Text, View } from "react-native";

import { COLORS, SPACING } from "../utils/constants";

export default function FeedbackCard({ score = 0, title = "Feedback", points = [] }) {
  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: SPACING.sm,
        padding: SPACING.md
      }}
    >
      <Text selectable style={{ color: COLORS.text, fontSize: 18, fontWeight: "800" }}>
        {title}
      </Text>
      <Text selectable style={{ color: COLORS.primary, fontSize: 28, fontVariant: ["tabular-nums"], fontWeight: "900" }}>
        {score}/10
      </Text>
      {points.map((point) => (
        <Text key={point} selectable style={{ color: COLORS.muted, fontSize: 15, lineHeight: 22 }}>
          {point}
        </Text>
      ))}
    </View>
  );
}
