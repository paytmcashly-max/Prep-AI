import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";

export default function HapticPressable({ disabled, onPress, ...props }) {
  const handlePress = async (event) => {
    if (disabled) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.(event);
  };

  return <Pressable {...props} disabled={disabled} onPress={handlePress} />;
}
