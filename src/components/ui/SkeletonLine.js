import { StyleSheet, View } from "react-native";

import { RADIUS, useAppTheme } from "../../theme";

export default function SkeletonLine({ height = 14, style, width = "100%" }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.line,
        {
          backgroundColor: colors.borderStrong,
          height,
          width
        },
        style
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    borderRadius: RADIUS.pill,
    opacity: 0.55
  }
});
