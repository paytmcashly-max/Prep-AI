import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { getCurrentUser } from "../services/authService";
import { showSessionCompleteNotification } from "../services/notificationService";
import { generateDailyTip } from "../services/openaiService";
import { calculateCurrentStreak, fetchUserSessions } from "../services/sessionService";
import { useUserStore } from "../store/userStore";

const COLORS = {
  accent: "#6C63FF",
  background: "#0A0A0A",
  card: "#1A1A1A",
  muted: "#A3A3A3",
  text: "#FFFFFF"
};

const getDisplayName = (profileName) => {
  if (profileName?.trim()) {
    return profileName.trim();
  }

  const currentUser = getCurrentUser();
  const displayName = currentUser?.displayName?.trim();

  if (displayName) {
    return displayName;
  }

  return "there";
};

const formatSessionDate = (date) =>
  date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });

const getTodayDateKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

  useEffect(() => {
    setUserName(getDisplayName(profileName));
  }, [profileName]);

  useEffect(() => {
    let isMounted = true;

    const fetchDailyTip = async () => {
      try {
        setIsTipLoading(true);
        setTipError("");

        const cacheKey = `daily_tip_date_${getTodayDateKey()}`;
        const cachedTip = await AsyncStorage.getItem(cacheKey);

        if (cachedTip) {
          if (isMounted) {
            setDailyTip(cachedTip);
            setIsTipLoading(false);
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
          setTipError(error.message || "Could not load today's AI tip. Try again.");
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

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.topBar}>
        <Text selectable style={styles.greeting}>
          Good Morning, {userName}!
        </Text>
      </View>

      <View style={styles.streakCard}>
        {isSessionsLoading ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator color={COLORS.accent} />
            <Text selectable style={styles.loadingText}>
              Loading streak...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.streakNumberRow}>
              <Text selectable style={styles.streakNumber}>
                {streak}
              </Text>
              <Text style={styles.fireEmoji}>{"\uD83D\uDD25"}</Text>
            </View>
            <Text selectable style={styles.streakLabel}>
              Day Streak
            </Text>
          </>
        )}
      </View>

      <Pressable
        disabled={isStartingInterview}
        onPress={() => {
          setIsStartingInterview(true);
          navigation.navigate("MockInterview");
        }}
        style={({ pressed }) => [
          styles.ctaButton,
          pressed && !isStartingInterview && styles.pressed,
          isStartingInterview && styles.disabledButton
        ]}
      >
        {isStartingInterview ? (
          <ActivityIndicator color={COLORS.text} />
        ) : (
          <Text style={styles.ctaText}>Start Mock Interview</Text>
        )}
      </Pressable>

      <View style={styles.card}>
        <Text selectable style={styles.cardTitle}>
          AI Tip of the Day
        </Text>
        {isTipLoading ? (
          <View style={styles.tipSkeleton}>
            <View style={[styles.skeletonLine, styles.skeletonLineLong]} />
            <View style={[styles.skeletonLine, styles.skeletonLineMedium]} />
          </View>
        ) : (
          <Text selectable style={[styles.tipText, tipError && styles.errorText]}>
            {tipError || dailyTip}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text selectable style={styles.sectionTitle}>
          Recent Sessions
        </Text>

        {isSessionsLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={COLORS.accent} />
            <Text selectable style={styles.emptyText}>
              Loading recent sessions...
            </Text>
          </View>
        ) : null}

        {sessionsError ? (
          <Text selectable style={styles.sessionErrorText}>
            {sessionsError}
          </Text>
        ) : null}

        {!isSessionsLoading && !sessionsError && !recentSessions.length ? (
          <View style={styles.emptyState}>
            <Text selectable style={styles.emptyText}>
              No sessions yet. Start practicing!
            </Text>
          </View>
        ) : null}

        {!isSessionsLoading && !sessionsError
          ? recentSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionTopRow}>
                  <Text selectable style={styles.sessionTitle}>
                    {session.category || "Mock Interview"}
                  </Text>
                  <Text selectable style={styles.sessionScore}>
                    {Number(session.score || 0).toFixed(1)}/10
                  </Text>
                </View>
                <Text selectable style={styles.sessionMeta}>
                  {session.jobRole || "Role not set"} - {formatSessionDate(session.date)}
                </Text>
              </View>
            ))
          : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 18
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900"
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1
  },
  content: {
    gap: 22,
    padding: 20,
    paddingBottom: 36
  },
  ctaButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 64,
    paddingHorizontal: 18
  },
  ctaText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900"
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 10,
    justifyContent: "center",
    minHeight: 110,
    padding: 18
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center"
  },
  errorText: {
    color: "#FCA5A5"
  },
  disabledButton: {
    opacity: 0.6
  },
  fireEmoji: {
    fontSize: 42,
    lineHeight: 50
  },
  greeting: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 36
  },
  loadingInline: {
    alignItems: "center",
    gap: 10,
    minHeight: 128,
    justifyContent: "center"
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  section: {
    gap: 14
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900"
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  sessionErrorText: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.35)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    padding: 12
  },
  sessionMeta: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  sessionScore: {
    color: COLORS.accent,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "900"
  },
  sessionTitle: {
    color: COLORS.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "900"
  },
  sessionTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  skeletonLine: {
    backgroundColor: "#2A2A2A",
    borderRadius: 6,
    height: 14
  },
  skeletonLineLong: {
    width: "100%"
  },
  skeletonLineMedium: {
    width: "72%"
  },
  streakCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 24
  },
  streakLabel: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "800"
  },
  streakNumber: {
    color: COLORS.text,
    fontSize: 64,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 72
  },
  streakNumberRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  tipSkeleton: {
    gap: 10,
    paddingVertical: 4
  },
  tipText: {
    color: COLORS.muted,
    fontSize: 16,
    lineHeight: 24
  },
  topBar: {
    paddingTop: 8
  }
});
