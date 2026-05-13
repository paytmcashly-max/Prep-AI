import { View } from "react-native";

import { SPACING } from "../../theme";

export default function Inline({ align = "center", children, gap = "sm", justify, style, wrap }) {
  return (
    <View
      style={[
        {
          alignItems: align,
          flexDirection: "row",
          flexWrap: wrap ? "wrap" : "nowrap",
          gap: SPACING[gap] ?? gap,
          justifyContent: justify
        },
        style
      ]}
    >
      {children}
    </View>
  );
}
