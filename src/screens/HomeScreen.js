import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppIcon from "../components/ui/AppIcon";
import AppText from "../components/ui/AppText";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import Screen from "../components/ui/Screen";
import ScreenHero from "../components/ui/ScreenHero";
import SectionHeader from "../components/ui/SectionHeader";
import { trackEvent } from "../services/analyticsService";
import { getCurrentUser } from "../services/authService";
import { generateDailyTip } from "../services/aiService";
import { showSessionCompleteNotification } from "../services/notificationService";
import { calculateCurrentStreak, fetchUserSessions } from "../services/sessionService";
import { useUserStore } from "../store/userStore";
import { RADIUS, SPACING, useAppTheme } from "../theme";

const getDisplayName = (profileName) => {
  if (profileName?.trim()) {
    return profileName.trim().split(" ")[0];
  }

  const displayName = getCurrentUser()?.displayName?.trim();
  return displayName ? displayName.split(" ")[0] : "there";
};

const formatSessionDate = (date) =>
  date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });

const getTodayDateKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
};

export default function HomeScreen({ navigation, route }) {
  const { colors } = useAppTheme();
  const profileName = useUserStore((state) => state.profile.fullName || state.profile.name);
  const [userName, setUserName] = useState("there");
  const [dailyTip, setDailyTip] = useState("");
  const [isTipLoading, setIsTipLoading] = useState(true);
  const [tipError, setTipError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const streak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);
  const recentSessions = useMemo(() => sessions.slice(0, 3), [sessions]);
  const averageScore = useMemo(() => {
    if (!sessions.length) {
      return "0.0";
    }

    const score = sessions.reduce((sum, session) => sum + Number(session.score || 0), 0);
    return (score / sessions.length).toFixed(1);
  }, [sessions]);

  useEffect(() => {
    setUserName(getDisplayName(profileName));
  }, [profileName]);

  const loadDailyTip = useCallback(async ({ force = false } = {}) => {
    try {
      setIsTipLoading(true);
      setTipError("");

      const cacheKey = `daily_prep_tip_v2_${getTodayDateKey()}`;

      if (!force) {
        const cachedTip = await AsyncStorage.getItem(cacheKey);

        if (cachedTip) {
          setDailyTip(cachedTip);
          return;
        }
      }

      const tip = await generateDailyTip();
      setDailyTip(tip);
      await AsyncStorage.setItem(cacheKey, tip);
    } catch (error) {
      setTipError(error.message || "Could not load today's prep tip.");
    } finally {
      setIsTipLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDailyTip();
  }, [loadDailyTip]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadSessions = async () => {
        try {
          setIsSessionsLoading(true);
          setSessionsError("");

          const nextSessions = await fetchUserSessions();

          if (isActive) {
            setSessions(nextSessions);
          }
        } catch (error) {
          if (isActive) {
            setSessionsError(error.message || "Could not load recent sessions.");
          }
        } finally {
          if (isActive) {
            setIsSessionsLoading(false);
          }
        }
      };

      setUserName(getDisplayName(profileName));
      setIsStartingInterview(false);
      loadSessions();

      return () => {
        isActive = false;
      };
    }, [profileName])
  );

  const refreshHome = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setSessionsError("");
      setTipError("");

      const [nextSessions] = await Promise.all([
        fetchUserSessions(),
        loadDailyTip({ force: true })
      ]);
      setSessions(nextSessions);
    } catch (error) {
      setSessionsError(error.message || "Could not refresh your dashboard right now.");
    } finally {
      setIsRefreshing(false);
      setIsSessionsLoading(false);
    }
  }, [loadDailyTip]);

  useFocusEffect(
    useCallback(() => {
      if (!route?.params?.sessionCompleted) {
        return undefined;
      }

      showSessionCompleteNotification();
      navigation.setParams({ sessionCompleted: false });
      return undefined;
    }, [navigation, route?.params?.sessionCompleted])
  );

  const startPractice = () => {
    trackEvent("home_start_practice");
    setIsStartingInterview(true);
    navigation.navigate("Practice");
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refreshHome}
          tintColor={colors.secondary}
          colors={[colors.secondary]}
        />
      }
    >
      <ScreenHero
        badge="Interview coach"
        badgeIcon="sparkles"
        logo
        title={`${getGreeting()}, ${userName}`}
        subtitle="Take one focused round, review the feedback, and make your next answer sharper."
      >
        <View
          style={[
            styles.heroMetrics,
            { backgroundColor: colors.cardAlt, borderColor: colors.border }
          ]}
        >
          <View style={styles.heroMetric}>
            <AppText variant="monoNumber">{streak}d</AppText>
            <AppText tone="muted" variant="caption">
              Streak
            </AppText>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <View style={styles.heroMetric}>
            <AppText variant="monoNumber">{averageScore}</AppText>
            <AppText tone="muted" variant="caption">
              Average
            </AppText>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <View style={styles.heroMetric}>
            <AppText variant="monoNumber">{sessions.length}</AppText>
            <AppText tone="muted" variant="caption">
              Sessions
            </AppText>
          </View>
        </View>

        <AppButton
          loading={isStartingInterview}
          onPress={startPractice}
          rightIcon="next"
          style={styles.heroButton}
        >
          Start practice
        </AppButton>
      </ScreenHero>

      <AppCard style={styles.tipCard}>
        <SectionHeader
          icon="info"
          title="Prep tip"
          subtitle="A small nudge for today's practice."
        />
        {isTipLoading ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator color={colors.primary} />
            <AppText tone="muted" variant="bodyMuted">
              Preparing your tip...
            </AppText>
          </View>
        ) : tipError ? (
          <ErrorState message={tipError} title="Tip unavailable" />
        ) : (
          <AppText tone="muted" variant="body">
            {dailyTip}
          </AppText>
        )}
      </AppCard>

      <View style={styles.section}>
        <SectionHeader title="Recent sessions" subtitle="Only real saved practice appears here." />

        {isSessionsLoading ? (
          <LoadingState message="Loading recent practice." title="Recent sessions loading" />
        ) : null}

        {sessionsError ? <ErrorState message={sessionsError} title="Sessions unavailable" /> : null}

        {!isSessionsLoading && !sessionsError && !recentSessions.length ? (
          <EmptyState
            icon="practice"
            message="Complete a mock interview and your latest sessions will appear here."
            title="No sessions yet"
          />
        ) : null}

        {!isSessionsLoading && !sessionsError
          ? recentSessions.map((session) => (
              <AppCard key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionTop}>
                  <View
                    style={[
                      styles.sessionIcon,
                      { backgroundColor: colors.secondarySoft, borderColor: colors.border }
                    ]}
                  >
                    <AppIcon color={colors.primary} name="message" size={19} />
                  </View>
                  <View style={styles.sessionCopy}>
                    <AppText numberOfLines={1} variant="cardTitle">
                      {session.category || "Mock Interview"}
                    </AppText>
                    <View style={styles.sessionMetaRow}>
                      <AppIcon color={colors.muted} name="briefcase" size={14} />
                      <AppText numberOfLines={1} tone="muted" variant="bodyMuted">
                        {session.jobRole || "Role not set"}
                      </AppText>
                    </View>
                    <View style={styles.sessionMetaRow}>
                      <AppIcon color={colors.muted} name="calendar" size={14} />
                      <AppText numberOfLines={1} tone="muted" variant="bodyMuted">
                        {formatSessionDate(session.date)}
                      </AppText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.sessionScorePill,
                      { backgroundColor: colors.primarySoft, borderColor: colors.border }
                    ]}
                  >
                    <AppText tone="muted" variant="caption">
                      Score
                    </AppText>
                    <AppText color={colors.primary} variant="monoNumber">
                      {Number(session.score || 0).toFixed(1)}
                    </AppText>
                  </View>
                </View>
              </AppCard>
            ))
          : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroButton: {
    alignSelf: "stretch"
  },
  heroMetric: {
    alignItems: "center",
    flex: 1,
    gap: 2
  },
  heroMetrics: {
    alignItems: "center",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm
  },
  inlineLoading: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.md
  },
  section: {
    gap: SPACING.md
  },
  sessionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg
  },
  sessionCopy: {
    flex: 1,
    gap: SPACING.xs
  },
  sessionIcon: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  sessionMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.xs,
    minWidth: 0
  },
  sessionScorePill: {
    alignItems: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 1,
    minWidth: 66,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs
  },
  sessionTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.md
  },
  metricDivider: {
    height: 32,
    width: 1
  },
  tipCard: {
    gap: SPACING.md
  }
});
