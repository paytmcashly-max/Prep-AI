import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";

export default function KeyboardAwareScrollView({
  children,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  style,
  ...scrollViewProps
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={styles.keyboardView}
    >
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={style}
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
  }
});
