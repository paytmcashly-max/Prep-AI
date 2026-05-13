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
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1
  },
  heroGlow: {
    height: 240,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  orbOne: {
    backgroundColor: "rgba(139, 128, 255, 0.08)",
    borderRadius: 170,
    height: 340,
    left: -120,
    position: "absolute",
    top: -92,
    width: 340
  },
  orbTwo: {
    backgroundColor: "rgba(98, 214, 255, 0.055)",
    borderRadius: 150,
    height: 300,
    position: "absolute",
    right: -130,
    top: 150,
    width: 300
  },
  root: {
    flex: 1
  }
});
