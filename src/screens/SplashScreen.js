import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

import AppText from "../components/ui/AppText";
import { APP_NAME } from "../utils/constants";
import { RADIUS, SPACING, useAppTheme } from "../theme";

const LOGO_MARK = require("../../assets/logo-mark.png");

export default function SplashScreen({ navigation }) {
  const { colors } = useAppTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: liftAnim }]
          }
        ]}
      >
        <View
          style={[
            styles.logoMark,
            {
              backgroundColor: colors.cardAlt,
              borderColor: colors.border
            }
          ]}
        >
          <Image accessibilityIgnoresInvertColors source={LOGO_MARK} style={styles.logoImage} />
        </View>
        <AppText selectable={false} style={[styles.logoText, { color: colors.text }]} variant="display">
          {APP_NAME}
        </AppText>
        <AppText
          selectable={false}
          style={[styles.tagline, { color: colors.muted }]}
          variant="body"
        >
          Practice smarter. Interview better.
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
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
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    height: 88,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    width: 88
  },
  logoImage: {
    height: 72,
    width: 72
  },
  logoText: {
    textAlign: "center"
  },
  tagline: {
    lineHeight: 22,
    marginTop: SPACING.xs,
    textAlign: "center"
  }
});
