import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createScreenContentStyle, useAppTheme } from "../../theme";

export default function Screen({
  children,
  contentContainerStyle,
  noScroll = false,
  refreshControl,
  style
}) {
  const insets = useSafeAreaInsets();
  const { colors, gradients } = useAppTheme();
  const contentStyle = [
    styles.content,
    createScreenContentStyle(insets.top, insets.bottom),
    contentContainerStyle
  ];

  if (noScroll) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }, style]}>
        <LinearGradient colors={gradients.app} style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={gradients.hero} style={styles.heroGlow} />
        <View style={contentStyle}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      style={[styles.root, { backgroundColor: colors.background }, style]}
      contentContainerStyle={contentStyle}
    >
      <LinearGradient colors={gradients.app} style={StyleSheet.absoluteFillObject} />
      <LinearGradient colors={gradients.hero} style={styles.heroGlow} />
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1
  },
  heroGlow: {
    height: 210,
    left: 0,
    opacity: 0.72,
    position: "absolute",
    right: 0,
    top: 0
  },
  root: {
    flex: 1
  }
});
