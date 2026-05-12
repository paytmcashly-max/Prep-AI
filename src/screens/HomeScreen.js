import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import HapticPressable from "../components/HapticPressable";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppIcon from "../components/ui/AppIcon";
import AppText from "../components/ui/AppText";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Screen from "../components/ui/Screen";
import SectionHeader from "../components/ui/SectionHeader";
import StatCard from "../components/ui/StatCard";
import { trackEvent } from "../services/analyticsService";
import { getCurrentUser } from "../services/authService";
import { generateDailyTip } from "../services/aiService";
import { showSessionCompleteNotification } from "../services/notificationService";
import { calculateCurrentStreak, fetchUserSessions } from "../services/sessionService";
import { useUserStore } from "../store/userStore";
import { COLORS, PRESSED_STYLE, RADIUS, SPACING } from "../theme";

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

export default function HomeScreen({ navigation, route }) {
  const profileName = useUserStore((state) => state.profile.fullName || state.profile.name);
  const [userName, setUserName] = useState("there");
  const [dailyTip, setDailyTip] = useState("");
  const [isTipLoading, setIsTipLoading] = useState(true);
  const [tipError, setTipError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [isStartingInterview, setIsStartingInterview] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    const fetchDailyTip = async () => {
      try {
        setIsTipLoading(true);
        setTipError("");

        const cacheKey = `daily_prep_tip_v2_${getTodayDateKey()}`;
        const cachedTip = await AsyncStorage.getItem(cacheKey);

        if (cachedTip) {
          if (isMounted) {
            setDailyTip(cachedTip);
          }
          return;
        }

        const tip = await generateDailyTip();

        if (isMounted) {
          setDailyTip(tip);
        }

        await AsyncStorage.setItem(cacheKey, tip);
      } catch (error) {
        if (isMounted) {
          setTipError(error.message || "Could not load today's prep tip.");
        }
      } finally {
        if (isMounted) {
          setIsTipLoading(false);
        }
      }
    };

    fetchDailyTip();

    return () => {
      isMounted = false;
    };
  }, []);

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
    <Screen>
      <AppCard gradient="calm" style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <AppText tone="primary" variant="caption">
              {"Today's prep"}
            </AppText>
            <AppText variant="screenTitle">Good morning, {userName}</AppText>
            <AppText tone="muted" variant="body">
              Start with one focused round, then review the one improvement that matters most.
            </AppText>
          </View>
          <View style={styles.heroIcon}>
            <AppIcon color={COLORS.text} name="message" size={28} />
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
      </AppCard>

      <View style={styles.statsRow}>
        <StatCard icon="calendar" label="Streak" tone="warning" value={`${streak}d`} />
        <StatCard icon="gauge" label="Average" value={averageScore} />
        <StatCard icon="practice" label="Sessions" tone="success" value={String(sessions.length)} />
      </View>

      <AppCard style={styles.tipCard}>
        <SectionHeader
          icon="info"
          title="Prep tip"
          subtitle="A small nudge for today's practice."
        />
        {isTipLoading ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator color={COLORS.primary} />
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
          <AppCard style={styles.loadingCard}>
            <ActivityIndicator color={COLORS.primary} />
            <AppText tone="muted" variant="bodyMuted">
              Loading recent practice...
            </AppText>
          </AppCard>
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
              <HapticPressable
                key={session.id}
                style={({ pressed }) => [styles.sessionCard, pressed && PRESSED_STYLE]}
              >
                <View style={styles.sessionTop}>
                  <View style={styles.sessionIcon}>
                    <AppIcon color={COLORS.primary} name="message" size={19} />
                  </View>
                  <View style={styles.sessionCopy}>
                    <AppText numberOfLines={1} variant="cardTitle">
                      {session.category || "Mock Interview"}
                    </AppText>
                    <AppText numberOfLines={1} tone="muted" variant="bodyMuted">
                      {session.jobRole || "Role not set"} - {formatSessionDate(session.date)}
                    </AppText>
                  </View>
                  <AppText color={COLORS.primary} variant="monoNumber">
                    {Number(session.score || 0).toFixed(1)}
                  </AppText>
                </View>
              </HapticPressable>
            ))
          : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: SPACING.xl
  },
  heroButton: {
    alignSelf: "stretch"
  },
  heroCopy: {
    flex: 1,
    gap: SPACING.sm
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(124, 109, 255, 0.24)",
    borderRadius: RADIUS.lg,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  heroTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.md
  },
  inlineLoading: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.md
  },
  loadingCard: {
    alignItems: "center",
    flexDirection: "row"
  },
  section: {
    gap: SPACING.md
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.pill,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  sessionTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.md
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md
  },
  tipCard: {
    gap: SPACING.md
  }
});
