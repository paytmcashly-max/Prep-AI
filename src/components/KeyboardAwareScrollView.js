import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "../theme";

export default function KeyboardAwareScrollView({
  children,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  scrollRef,
  style,
  ...scrollViewProps
}) {
  const { colors, gradients } = useAppTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={styles.keyboardView}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <LinearGradient colors={gradients.app} style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={gradients.hero} style={styles.heroGlow} />
      </View>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        ref={scrollRef}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={[styles.scrollView, { backgroundColor: colors.background }, style]}
        contentContainerStyle={contentContainerStyle}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1
  },
  heroGlow: {
    height: 210,
    left: 0,
    opacity: 0.72,
    position: "absolute",
    right: 0,
    top: 0
  },
  scrollView: {
    flex: 1
  }
});
