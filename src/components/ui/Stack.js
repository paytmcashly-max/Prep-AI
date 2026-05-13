import { View } from "react-native";

import { SPACING } from "../../theme";

export default function Stack({ align, children, gap = "md", justify, style }) {
  return (
    <View
      style={[
        {
          alignItems: align,
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
