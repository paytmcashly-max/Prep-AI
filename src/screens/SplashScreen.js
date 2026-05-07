import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { APP_NAME, COLORS } from "../utils/constants";

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const liftAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 850,
        useNativeDriver: true
      }),
      Animated.timing(liftAnim, {
        toValue: 0,
        duration: 850,
        useNativeDriver: true
      })
    ]).start();

    const timer = setTimeout(() => {
      navigation?.replace?.("Onboarding");
    }, 2200);

    return () => clearTimeout(timer);
  }, [fadeAnim, liftAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: liftAnim }]
          }
        ]}
      >
        <View style={styles.logoMark}>
          <Text selectable style={styles.logoInitial}>
            P
          </Text>
        </View>
        <Text selectable style={styles.logoText}>
          {APP_NAME}
        </Text>
        <Text selectable style={styles.tagline}>
          Practice smarter. Interview sharper.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  content: {
    alignItems: "center",
    gap: 14
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 26,
    height: 76,
    justifyContent: "center",
    width: 76
  },
  logoInitial: {
    color: COLORS.surface,
    fontSize: 38,
    fontWeight: "900"
  },
  logoText: {
    color: COLORS.text,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 0
  },
  tagline: {
    color: COLORS.muted,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center"
  }
});
