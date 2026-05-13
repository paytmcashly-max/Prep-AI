import { Image, StyleSheet, View } from "react-native";

import { RADIUS, useAppTheme } from "../../theme";

const LOGO_MARK = require("../../../assets/logo-mark.png");

const SIZE = {
  lg: 62,
  md: 44,
  sm: 36,
  xl: 72
};

export default function BrandMark({ size = "md", style }) {
  const { colors } = useAppTheme();
  const frameSize = SIZE[size] || SIZE.md;
  const logoSize = Math.round(frameSize * 0.72);

  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor: colors.secondarySoft,
          borderColor: colors.border,
          height: frameSize,
          width: frameSize
        },
        style
      ]}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={LOGO_MARK}
        style={{ height: logoSize, width: logoSize }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    justifyContent: "center"
  }
});
