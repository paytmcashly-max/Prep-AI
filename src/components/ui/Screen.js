import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, createScreenContentStyle, GRADIENTS } from "../../theme";

export default function Screen({
  children,
  contentContainerStyle,
  noScroll = false,
  refreshControl,
  style
}) {
  const insets = useSafeAreaInsets();
  const contentStyle = [
    styles.content,
    createScreenContentStyle(insets.bottom),
    contentContainerStyle
  ];

  if (noScroll) {
    return (
      <View style={[styles.root, style]}>
        <LinearGradient colors={GRADIENTS.app} style={StyleSheet.absoluteFillObject} />
        <View style={contentStyle}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      style={[styles.root, style]}
      contentContainerStyle={contentStyle}
    >
      <LinearGradient colors={GRADIENTS.hero} style={styles.heroGlow} />
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1
  },
  heroGlow: {
    height: 260,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  root: {
    backgroundColor: COLORS.background,
    flex: 1
  }
});
