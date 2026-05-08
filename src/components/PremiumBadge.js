import { Text, View } from "react-native";

import { SPACING } from "../utils/constants";

export default function PremiumBadge() {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: "#FEF3C7",
        borderRadius: 999,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm
      }}
    >
      <Text selectable style={{ color: "#92400E", fontSize: 13, fontWeight: "900" }}>
        Premium
      </Text>
    </View>
  );
}
