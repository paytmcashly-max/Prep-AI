import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import HapticPressable from "../components/HapticPressable";
import { useSubscriptionStore } from "../store/subscriptionStore";

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

const DIFFICULTY_OPTIONS = [
  {
    helper: "Beginner-friendly",
    label: "Easy",
    value: "easy"
  },
  {
    helper: "Realistic interview",
    label: "Medium",
    value: "medium"
  },
  {
    helper: "Senior/challenging",
    label: "Hard",
    value: "hard"
  }
];

const FREE_QUESTION_COUNT = 5;
const PREMIUM_QUESTION_COUNT_OPTIONS = [5, 10, 15, 20];

const isValidDifficulty = (difficulty) =>
  DIFFICULTY_OPTIONS.some((option) => option.value === difficulty);

const isValidQuestionCount = (questionCount) =>
  PREMIUM_QUESTION_COUNT_OPTIONS.includes(Number(questionCount));

export default function PracticeScreen({ navigation, route }) {
  const [startingCategory, setStartingCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(FREE_QUESTION_COUNT);
  const isPremium = useSubscriptionStore((state) => state.isPremium);

  useFocusEffect(
    useCallback(() => {
      setStartingCategory("");
    }, [])
  );

  useEffect(() => {
    const nextDifficulty = route?.params?.difficulty;
    const nextQuestionCount = route?.params?.questionCount;

    if (isValidDifficulty(nextDifficulty)) {
      setSelectedDifficulty(nextDifficulty);
    }

    if (isValidQuestionCount(nextQuestionCount)) {
      setSelectedQuestionCount(Number(nextQuestionCount));
    }
  }, [route?.params?.difficulty, route?.params?.questionCount]);

  const startCategory = (category) => {
    setStartingCategory(category);
    navigation.navigate("MockInterview", {
      category,
      difficulty: selectedDifficulty,
      questionCount: isPremium ? selectedQuestionCount : FREE_QUESTION_COUNT
    });
  };

  const handleModePress = (mode) => {
    if (!mode.isLocked) {
      return;
    }

    if (isPremium) {
      Alert.alert("Coming soon for Premium", `${mode.title} is not implemented yet.`);
      return;
    }

    navigation.navigate("Paywall");
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Set Up Practice
        </Text>
        <Text selectable style={styles.subtitle}>
          Choose the difficulty and length first, then tap a category to start.
        </Text>
      </View>

      <View style={styles.difficultySection}>
        <Text selectable style={styles.sectionTitle}>
          1. Interview Difficulty
        </Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTY_OPTIONS.map((option) => {
            const isSelected = selectedDifficulty === option.value;

            return (
              <HapticPressable
                key={option.value}
                onPress={() => setSelectedDifficulty(option.value)}
                style={({ pressed }) => [
                  styles.difficultyChip,
                  isSelected && styles.difficultyChipSelected,
                  pressed && styles.pressed
                ]}
              >
                <Text
                  style={[
                    styles.difficultyChipText,
                    isSelected && styles.difficultyChipTextSelected
                  ]}
                >
                  {option.label}
                </Text>
              </HapticPressable>
            );
          })}
        </View>
        <Text selectable style={styles.difficultyHelper}>
          {DIFFICULTY_OPTIONS.find((option) => option.value === selectedDifficulty)?.helper}
        </Text>
      </View>

      <View style={styles.difficultySection}>
        <Text selectable style={styles.sectionTitle}>
          2. Interview Length
        </Text>
        <View style={styles.questionCountRow}>
          {PREMIUM_QUESTION_COUNT_OPTIONS.map((count) => {
            const isSelected = selectedQuestionCount === count;
            const isLocked = !isPremium && count !== FREE_QUESTION_COUNT;

            return (
              <HapticPressable
                key={count}
                disabled={isLocked}
                onPress={() => setSelectedQuestionCount(count)}
                style={({ pressed }) => [
                  styles.questionCountChip,
                  isSelected && styles.questionCountChipSelected,
                  isLocked && styles.lockedModeCard,
                  pressed && !isLocked && styles.pressed
                ]}
              >
                <Text
                  style={[
                    styles.questionCountChipText,
                    isSelected && styles.questionCountChipTextSelected,
                    isLocked && styles.lockedText
                  ]}
                >
                  {count}
                </Text>
              </HapticPressable>
            );
          })}
        </View>
        <Text selectable style={styles.difficultyHelper}>
          {isPremium
            ? "Choose how many questions you want in this session."
            : "Free plan includes 5 questions. Upgrade for longer interviews."}
        </Text>
      </View>

      <View style={styles.categorySection}>
        <View style={styles.sectionHeaderRow}>
          <Text selectable style={styles.sectionTitle}>
            3. Pick Category to Start
          </Text>
          <Text selectable style={styles.selectionSummary}>
            {selectedDifficulty} - {isPremium ? selectedQuestionCount : FREE_QUESTION_COUNT} Qs
          </Text>
        </View>

        <View style={styles.categoryGrid}>
          {PRACTICE_CATEGORIES.map((category) => (
            <HapticPressable
              key={category.routeCategory}
              disabled={Boolean(startingCategory)}
              onPress={() => startCategory(category.routeCategory)}
              style={({ pressed }) => [
                styles.categoryCard,
                pressed && !startingCategory && styles.pressed,
                startingCategory &&
                  startingCategory !== category.routeCategory &&
                  styles.disabledCard
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
              <Text selectable style={styles.categoryAction}>
                Start round
              </Text>
            </HapticPressable>
          ))}
        </View>
      </View>

      <View style={styles.modeSection}>
        <Text selectable style={styles.sectionTitle}>
          Choose Mode
        </Text>

        <View style={styles.modeList}>
          {PRACTICE_MODES.map((mode) => {
            const isPremiumLocked = mode.isLocked && !isPremium;
            const modeSubtitle =
              mode.isLocked && isPremium ? "Coming soon for Premium" : mode.subtitle;

            return (
              <HapticPressable
                key={mode.title}
                onPress={() => handleModePress(mode)}
                style={({ pressed }) => [
                  styles.modeCard,
                  isPremiumLocked && styles.lockedModeCard,
                  pressed && mode.isLocked && styles.pressed
                ]}
              >
                <View style={styles.modeTextGroup}>
                  <Text selectable style={[styles.modeTitle, isPremiumLocked && styles.lockedText]}>
                    {mode.title}
                  </Text>
                  <Text selectable style={styles.modeSubtitle}>
                    {modeSubtitle}
                  </Text>
                </View>
                <Text style={styles.modeIcon}>
                  {mode.isLocked && isPremium ? "Soon" : mode.icon}
                </Text>
              </HapticPressable>
            );
          })}
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
  categoryAction: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "900",
    marginTop: "auto",
    textTransform: "uppercase"
  },
  categorySubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  categorySection: {
    gap: 14
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
  difficultyChip: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12
  },
  difficultyChipSelected: {
    backgroundColor: "rgba(108, 99, 255, 0.18)",
    borderColor: COLORS.accent
  },
  difficultyChipText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "900"
  },
  difficultyChipTextSelected: {
    color: COLORS.text
  },
  difficultyHelper: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 10
  },
  difficultySection: {
    gap: 12
  },
  header: {
    gap: 8,
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
  questionCountChip: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 10
  },
  questionCountChipSelected: {
    backgroundColor: "rgba(108, 99, 255, 0.18)",
    borderColor: COLORS.accent
  },
  questionCountChipText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "900"
  },
  questionCountChipTextSelected: {
    color: COLORS.text
  },
  questionCountRow: {
    flexDirection: "row",
    gap: 10
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900"
  },
  sectionHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between"
  },
  selectionSummary: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 38
  }
});
