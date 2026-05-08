import { Text, View } from "react-native";

import { COLORS, SPACING } from "../utils/constants";

export default function QuestionCard({ category = "HR", question }) {
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
      <Text selectable style={{ color: COLORS.primary, fontSize: 13, fontWeight: "800" }}>
        {category}
      </Text>
      <Text
        selectable
        style={{ color: COLORS.text, fontSize: 18, fontWeight: "700", lineHeight: 25 }}
      >
        {question}
      </Text>
    </View>
  );
}
