import { Pressable, Text, View } from "react-native";

import { COLORS, SPACING } from "../utils/constants";

export default function CategoryPicker({ categories = [], selected, onSelect }) {
  return (
    <View style={{ gap: SPACING.sm }}>
      {categories.map((category) => {
        const active = selected === category;

        return (
          <Pressable
            key={category}
            onPress={() => onSelect?.(category)}
            style={{
              backgroundColor: active ? COLORS.primary : COLORS.surface,
              borderColor: active ? COLORS.primary : COLORS.border,
              borderRadius: 8,
              borderWidth: 1,
              padding: SPACING.md
            }}
          >
            <Text
              selectable
              style={{
                color: active ? COLORS.surface : COLORS.text,
                fontSize: 16,
                fontWeight: "700"
              }}
            >
              {category}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
