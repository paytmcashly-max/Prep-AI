import { StyleSheet, View } from "react-native";

import { RADIUS, useAppTheme } from "../../theme";

export default function ProgressBar({ progress = 0, style }) {
  const { colors } = useAppTheme();
  const clamped = Math.max(0, Math.min(Number(progress) || 0, 1));

  return (
    <View style={[styles.track, { backgroundColor: colors.borderStrong }, style]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: colors.secondary,
            width: `${clamped * 100}%`
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    borderRadius: RADIUS.pill,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  track: {
    borderRadius: RADIUS.pill,
    height: 8,
    overflow: "hidden"
  }
});
