import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

import { APP_NAME, COLORS } from "../utils/constants";

const LOGO_MARK = require("../../assets/logo-mark.png");

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
          <Image accessibilityIgnoresInvertColors source={LOGO_MARK} style={styles.logoImage} />
        </View>
        <Text selectable style={styles.logoText}>
          {APP_NAME}
        </Text>
        <Text selectable style={styles.tagline}>
          Practice smarter. Interview better.
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
    gap: 12
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.09)",
    borderRadius: 30,
    borderWidth: 1,
    height: 88,
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    width: 88
  },
  logoImage: {
    height: 72,
    width: 72
  },
  logoText: {
    color: COLORS.text,
    fontFamily: "Inter_800ExtraBold",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -0.2
  },
  tagline: {
    color: COLORS.muted,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center"
  }
});
