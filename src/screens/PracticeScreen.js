import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const COLORS = {
  accent: "#6C63FF",
  background: "#0A0A0A",
  card: "#1A1A1A",
  muted: "#A3A3A3",
  text: "#FFFFFF"
};

const PRACTICE_CATEGORIES = [
  {
    icon: "💼",
    routeCategory: "HR",
    subtitle: "Master common HR rounds",
    title: "HR Questions"
  },
  {
    icon: "💻",
    routeCategory: "Technical",
    subtitle: "Practice role-based technical answers",
    title: "Technical Questions"
  },
  {
    icon: "⭐",
    routeCategory: "Behavioral",
    subtitle: "Structure answers with the STAR method",
    title: "Behavioral (STAR Method)"
  },
  {
    icon: "🏢",
    routeCategory: "Company",
    subtitle: "Prepare for company-specific rounds",
    title: "Company Specific"
  }
];

const PRACTICE_MODES = [
  {
    icon: "✅",
    isLocked: false,
    subtitle: "Free",
    title: "Text Mode"
  },
  {
    icon: "🔒",
    isLocked: true,
    subtitle: "Premium",
    title: "Voice Mode"
  },
  {
    icon: "🔒",
    isLocked: true,
    subtitle: "Premium",
    title: "Video Mode"
  }
];

export default function PracticeScreen({ navigation }) {
  const [startingCategory, setStartingCategory] = useState("");

  useFocusEffect(
    useCallback(() => {
      setStartingCategory("");
    }, [])
  );

  const startCategory = (category) => {
    setStartingCategory(category);
    navigation.navigate("MockInterview", { category });
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Choose Practice Category
        </Text>
      </View>

      <View style={styles.categoryGrid}>
        {PRACTICE_CATEGORIES.map((category) => (
          <Pressable
            key={category.routeCategory}
            disabled={Boolean(startingCategory)}
            onPress={() => startCategory(category.routeCategory)}
            style={({ pressed }) => [
              styles.categoryCard,
              pressed && !startingCategory && styles.pressed,
              startingCategory && startingCategory !== category.routeCategory && styles.disabledCard
            ]}
          >
            {startingCategory === category.routeCategory ? (
              <ActivityIndicator color={COLORS.accent} size="large" />
            ) : (
              <Text style={styles.categoryIcon}>{category.icon}</Text>
            )}
            <View style={styles.categoryCopy}>
              <Text selectable style={styles.categoryTitle}>
                {category.title}
              </Text>
              <Text selectable style={styles.categorySubtitle}>
                {category.subtitle}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.modeSection}>
        <Text selectable style={styles.sectionTitle}>
          Choose Mode
        </Text>

        <View style={styles.modeList}>
          {PRACTICE_MODES.map((mode) => (
            <View
              key={mode.title}
              style={[styles.modeCard, mode.isLocked && styles.lockedModeCard]}
              pointerEvents={mode.isLocked ? "none" : "auto"}
            >
              <View style={styles.modeTextGroup}>
                <Text selectable style={[styles.modeTitle, mode.isLocked && styles.lockedText]}>
                  {mode.title}
                </Text>
                <Text selectable style={styles.modeSubtitle}>
                  {mode.subtitle}
                </Text>
              </View>
              <Text style={styles.modeIcon}>{mode.icon}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoryCard: {
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    gap: 14,
    minHeight: 168,
    padding: 16
  },
  categoryCopy: {
    gap: 8
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  categoryIcon: {
    fontSize: 34,
    lineHeight: 42
  },
  categorySubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20
  },
  categoryTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1
  },
  content: {
    gap: 24,
    padding: 20,
    paddingBottom: 36
  },
  disabledCard: {
    opacity: 0.55
  },
  header: {
    paddingTop: 8
  },
  lockedModeCard: {
    opacity: 0.55
  },
  lockedText: {
    color: "#D4D4D4"
  },
  modeCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  modeIcon: {
    fontSize: 24,
    lineHeight: 30
  },
  modeList: {
    gap: 12
  },
  modeSection: {
    gap: 14
  },
  modeSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  modeTextGroup: {
    gap: 4
  },
  modeTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900"
  },
  pressed: {
    borderColor: COLORS.accent,
    opacity: 0.84,
    transform: [{ scale: 0.99 }]
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900"
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 38
  }
});
