import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import HapticPressable from "../components/HapticPressable";
import AppCard from "../components/ui/AppCard";
import AppIcon from "../components/ui/AppIcon";
import AppText from "../components/ui/AppText";
import ErrorState from "../components/ui/ErrorState";
import LimitCard from "../components/ui/LimitCard";
import Screen from "../components/ui/Screen";
import SectionHeader from "../components/ui/SectionHeader";
import { getUsageStatus } from "../services/apiClient";
import { formatCountdown } from "../services/quotaService";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { COLORS, PRESSED_STYLE, RADIUS, SPACING } from "../theme";

const PRACTICE_CATEGORIES = [
  {
    icon: "message",
    routeCategory: "HR",
    subtitle: "Intro, motivation, strengths, and career story.",
    title: "HR Round"
  },
  {
    icon: "technical",
    routeCategory: "Technical",
    subtitle: "Role-based questions with concise technical answers.",
    title: "Technical Round"
  },
  {
    icon: "badge",
    routeCategory: "Behavioral",
    subtitle: "Structure examples with context, action, and result.",
    title: "Behavioral Round"
  },
  {
    icon: "company",
    routeCategory: "Company",
    subtitle: "Prepare role-fit and company-specific responses.",
    title: "Company Round"
  }
];

const DIFFICULTY_OPTIONS = [
  { helper: "Beginner-friendly questions", label: "Easy", value: "easy" },
  { helper: "Realistic interview level", label: "Medium", value: "medium" },
  { helper: "Senior and challenging prompts", label: "Hard", value: "hard" }
];

const FREE_QUESTION_COUNT = 5;
const PREMIUM_QUESTION_COUNT_OPTIONS = [5, 10, 15, 20];
const LIMIT_BENEFITS = [
  "Unlimited interview practice",
  "Longer sessions: 10/15/20 questions",
  "More resume scans",
  "Priority feedback as premium features launch"
];

const getCountdownUntil = (resetAt) => {
  const resetTime = new Date(resetAt || 0).getTime();
  return Number.isFinite(resetTime) ? formatCountdown(resetTime - Date.now()) : "--:--:--";
};

export default function PracticeScreen({ navigation }) {
  const [startingCategory, setStartingCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(FREE_QUESTION_COUNT);
  const [usageStatus, setUsageStatus] = useState(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState("");
  const [limitCountdown, setLimitCountdown] = useState("--:--:--");
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const interviewQuota = usageStatus?.interview;
  const hasServerPremiumAccess =
    usageStatus?.isPremium === true || interviewQuota?.isPremium === true;
  const hasPremiumAccess = hasServerPremiumAccess;
  const isLocalPremiumPendingServerSync =
    isPremium &&
    !hasServerPremiumAccess &&
    interviewQuota &&
    Number(interviewQuota.remaining || 0) <= 0;
  const isInterviewLimitReached =
    !isPremium && !hasPremiumAccess && interviewQuota && Number(interviewQuota.remaining || 0) <= 0;

  const loadUsageStatus = useCallback(async () => {
    try {
      setIsLoadingUsage(true);
      setUsageError("");
      setUsageStatus(await getUsageStatus());
    } catch (error) {
      setUsageError(error.message || "Could not check your free practice limit.");
    } finally {
      setIsLoadingUsage(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setStartingCategory("");
      useSubscriptionStore
        .getState()
        .refreshSubscriptionStatus()
        .catch(() => null);
      loadUsageStatus();
    }, [loadUsageStatus])
  );

  useEffect(() => {
    if (isPremium) {
      setLimitCountdown("--:--:--");
    }
  }, [isPremium]);

  useEffect(() => {
    if (!isInterviewLimitReached) {
      return undefined;
    }

    const updateCountdown = () => {
      const resetTime = interviewQuota?.resetAt ? new Date(interviewQuota.resetAt).getTime() : NaN;

      if (Number.isFinite(resetTime) && resetTime <= Date.now()) {
        setLimitCountdown("00:00:00");
        setUsageStatus((current) =>
          current
            ? {
                ...current,
                interview: {
                  ...current.interview,
                  remaining: current.interview?.limit || FREE_QUESTION_COUNT,
                  used: 0
                }
              }
            : current
        );
        loadUsageStatus();
        return;
      }

      setLimitCountdown(getCountdownUntil(interviewQuota?.resetAt));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [interviewQuota?.resetAt, isInterviewLimitReached, loadUsageStatus]);

  const startCategory = (category) => {
    if (isInterviewLimitReached) {
      return;
    }

    setStartingCategory(category);
    navigation.navigate("MockInterview", {
      category,
      difficulty: selectedDifficulty,
      questionCount: hasPremiumAccess ? selectedQuestionCount : FREE_QUESTION_COUNT
    });
    setTimeout(() => setStartingCategory(""), 0);
  };

  const handleLockedMode = (title) => {
    if (isPremium) {
      Alert.alert("Coming soon", `${title} is planned for premium users, but is not live yet.`);
      return;
    }

    navigation.navigate("Paywall");
  };

  if (isLoadingUsage) {
    return (
      <Screen>
        <AppCard style={styles.loadingCard}>
          <ActivityIndicator color={COLORS.primary} />
          <AppText tone="muted" variant="body">
            Checking your practice limit...
          </AppText>
        </AppCard>
      </Screen>
    );
  }

  if (usageError) {
    return (
      <Screen>
        <ErrorState message={usageError} onRetry={loadUsageStatus} title="Practice unavailable" />
      </Screen>
    );
  }

  if (isInterviewLimitReached) {
    return (
      <Screen>
        <LimitCard
          benefits={LIMIT_BENEFITS}
          countdownLabel="Available again"
          message="You've used today's free interview questions. Upgrade for unlimited practice, or come back tomorrow."
          onBack={() => navigation.navigate("Home")}
          onUpgrade={() => navigation.navigate("Paywall")}
          resetCountdown={limitCountdown}
          secondaryLabel="Back to Home"
          title="Daily free limit reached"
        />
      </Screen>
    );
  }

  if (isLocalPremiumPendingServerSync) {
    return (
      <Screen>
        <LimitCard
          benefits={[]}
          message="Premium is active on this device, but server access has not synced yet. Refresh your plan and try again."
          onBack={() => navigation.navigate("Home")}
          onUpgrade={() => {
            useSubscriptionStore.getState().refreshSubscriptionStatus().finally(loadUsageStatus);
          }}
          primaryLabel="Refresh Plan"
          secondaryLabel="Back to Home"
          title="Premium sync pending"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText tone="primary" variant="caption">
          Practice room
        </AppText>
        <AppText variant="screenTitle">Choose your interview round</AppText>
        <AppText tone="muted" variant="body">
          Set the difficulty and length first. Then choose a round to start.
        </AppText>
      </View>

      <AppCard style={styles.setupCard}>
        <SectionHeader title="Difficulty" subtitle="Start easy if you want warmer questions." />
        <View style={styles.segmentRow}>
          {DIFFICULTY_OPTIONS.map((option) => {
            const isSelected = selectedDifficulty === option.value;

            return (
              <HapticPressable
                key={option.value}
                onPress={() => setSelectedDifficulty(option.value)}
                style={({ pressed }) => [
                  styles.segment,
                  isSelected && styles.segmentSelected,
                  pressed && PRESSED_STYLE
                ]}
              >
                <AppText
                  color={isSelected ? COLORS.text : COLORS.muted}
                  selectable={false}
                  variant="button"
                >
                  {option.label}
                </AppText>
              </HapticPressable>
            );
          })}
        </View>
        <AppText tone="muted" variant="bodyMuted">
          {DIFFICULTY_OPTIONS.find((option) => option.value === selectedDifficulty)?.helper}
        </AppText>

        <SectionHeader
          title="Session length"
          subtitle={
            hasPremiumAccess
              ? "Choose the number of questions for this session."
              : "Free practice includes 5 questions."
          }
        />
        <View style={styles.countRow}>
          {PREMIUM_QUESTION_COUNT_OPTIONS.map((count) => {
            const isSelected = selectedQuestionCount === count;
            const isLocked = !hasPremiumAccess && count !== FREE_QUESTION_COUNT;

            return (
              <HapticPressable
                key={count}
                disabled={isLocked}
                onPress={() => setSelectedQuestionCount(count)}
                style={({ pressed }) => [
                  styles.countChip,
                  isSelected && styles.countChipSelected,
                  isLocked && styles.locked,
                  pressed && !isLocked && PRESSED_STYLE
                ]}
              >
                <AppText
                  color={isLocked ? COLORS.disabledText : isSelected ? COLORS.text : COLORS.muted}
                  selectable={false}
                  variant="button"
                >
                  {count}
                </AppText>
              </HapticPressable>
            );
          })}
        </View>
      </AppCard>

      <View style={styles.section}>
        <SectionHeader
          title="Interview category"
          subtitle={`${selectedDifficulty} - ${
            hasPremiumAccess ? selectedQuestionCount : FREE_QUESTION_COUNT
          } questions`}
        />
        <View style={styles.categoryGrid}>
          {PRACTICE_CATEGORIES.map((category) => (
            <HapticPressable
              key={category.routeCategory}
              disabled={Boolean(startingCategory)}
              onPress={() => startCategory(category.routeCategory)}
              style={({ pressed }) => [
                styles.categoryCard,
                startingCategory && startingCategory !== category.routeCategory && styles.locked,
                pressed && !startingCategory && PRESSED_STYLE
              ]}
            >
              <View style={styles.categoryTop}>
                <View style={styles.categoryIcon}>
                  {startingCategory === category.routeCategory ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <AppIcon color={COLORS.primary} name={category.icon} size={24} />
                  )}
                </View>
                <AppIcon color={COLORS.muted} name="next" size={18} />
              </View>
              <View style={styles.categoryCopy}>
                <AppText variant="cardTitle">{category.title}</AppText>
                <AppText tone="muted" variant="bodyMuted">
                  {category.subtitle}
                </AppText>
              </View>
            </HapticPressable>
          ))}
        </View>
      </View>

      <AppCard style={styles.modeCard} tone="subtle">
        <SectionHeader title="Modes" subtitle="Text mode is live. Voice and video are planned." />
        <View style={styles.modeRow}>
          <View style={styles.modePill}>
            <AppIcon color={COLORS.success} name="check" size={16} />
            <AppText variant="caption">Text mode</AppText>
          </View>
          <HapticPressable onPress={() => handleLockedMode("Voice mode")} style={styles.modePill}>
            <AppIcon color={COLORS.muted} name="lock" size={16} />
            <AppText tone="muted" variant="caption">
              Voice soon
            </AppText>
          </HapticPressable>
          <HapticPressable onPress={() => handleLockedMode("Video mode")} style={styles.modePill}>
            <AppIcon color={COLORS.muted} name="lock" size={16} />
            <AppText tone="muted" variant="caption">
              Video soon
            </AppText>
          </HapticPressable>
        </View>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  categoryCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    gap: SPACING.lg,
    minHeight: 172,
    padding: SPACING.lg
  },
  categoryCopy: {
    gap: SPACING.xs
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md
  },
  categoryIcon: {
    alignItems: "center",
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  categoryTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  countChip: {
    alignItems: "center",
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48
  },
  countChipSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary
  },
  countRow: {
    flexDirection: "row",
    gap: SPACING.sm
  },
  header: {
    gap: SPACING.sm
  },
  loadingCard: {
    alignItems: "center",
    flexDirection: "row"
  },
  locked: {
    opacity: 0.48
  },
  modeCard: {
    gap: SPACING.md
  },
  modePill: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.xs,
    minHeight: 40,
    paddingHorizontal: SPACING.md
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm
  },
  section: {
    gap: SPACING.md
  },
  segment: {
    alignItems: "center",
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: SPACING.sm
  },
  segmentRow: {
    flexDirection: "row",
    gap: SPACING.sm
  },
  segmentSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary
  },
  setupCard: {
    gap: SPACING.lg
  }
});
