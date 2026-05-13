import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

import { COLORS, RADIUS } from "../theme";

export default function SkeletonBox({ style }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          duration: 700,
          toValue: 0.85,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          duration: 700,
          toValue: 0.35,
          useNativeDriver: true
        })
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { opacity }, style]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.cardPressed,
    borderRadius: RADIUS.md
  }
});
