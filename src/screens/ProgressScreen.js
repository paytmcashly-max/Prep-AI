import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import SkeletonBox from "../components/SkeletonBox";
import {
  calculateAverageScore,
  calculateCurrentStreak,
  fetchUserSessions,
  getLastSevenDayScores
} from "../services/sessionService";
import { useProgressStore } from "../store/progressStore";

const COLORS = {
  accent: "#6C63FF",
  background: "#0A0A0A",
  card: "#1A1A1A",
  border: "#2A2A2A",
  muted: "#A3A3A3",
  text: "#FFFFFF",
  green: "#22C55E",
  red: "#EF4444"
};

function TopicBadge({ label, tone }) {
  const isStrong = tone === "strong";

  return (
    <View style={[styles.badge, isStrong ? styles.strongBadge : styles.improvementBadge]}>
      <Text
        selectable
        style={[styles.badgeText, isStrong ? styles.strongText : styles.improvementText]}
      >
        {label}
      </Text>
    </View>
  );
}

function EmptyPanel({ title, message }) {
  return (
    <View style={styles.emptyPanel}>
      <Text selectable style={styles.emptyTitle}>
        {title}
      </Text>
      <Text selectable style={styles.emptyText}>
        {message}
      </Text>
    </View>
  );
}

const formatTopicLabel = (category) => {
  const normalizedCategory = String(category || "General").trim();

  if (normalizedCategory === "HR") {
    return "HR Questions";
  }

  if (normalizedCategory === "Technical") {
    return "Technical Questions";
  }

  if (normalizedCategory === "Behavioral") {
    return "Behavioral";
  }

  if (normalizedCategory === "Company") {
    return "Company Specific";
  }

  return normalizedCategory || "General";
};

const getSessionTopics = (sessions) => {
  const scoresByCategory = sessions.reduce((topics, session) => {
    const category = session.category || "General";

    if (!topics[category]) {
      topics[category] = [];
    }

    topics[category].push(Number(session.score || 0));
    return topics;
  }, {});

  return Object.entries(scoresByCategory)
    .map(([category, scores]) => {
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      return {
        average,
        count: scores.length,
        label: formatTopicLabel(category)
      };
    })
    .sort((a, b) => b.average - a.average);
};

export default function ProgressScreen() {
  const sessions = useProgressStore((state) => state.sessions);
  const hasLoadedSessions = useProgressStore((state) => state.hasLoadedSessions);
  const setCachedSessions = useProgressStore((state) => state.setSessions);
  const [isLoading, setIsLoading] = useState(!hasLoadedSessions);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const weeklyScores = useMemo(() => getLastSevenDayScores(sessions), [sessions]);
  const averageScore = useMemo(() => calculateAverageScore(sessions), [sessions]);
  const currentStreak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);
  const sessionTopics = useMemo(() => getSessionTopics(sessions), [sessions]);
  const strongTopics = useMemo(
    () => sessionTopics.filter((topic) => topic.average >= 7).slice(0, 3),
    [sessionTopics]
  );
  const improvementTopics = useMemo(
    () =>
      sessionTopics
        .filter((topic) => topic.average < 7)
        .sort((a, b) => a.average - b.average)
        .slice(0, 3),
    [sessionTopics]
  );
  const stats = useMemo(
    () => [
      { label: "Total Sessions", value: String(sessions.length) },
      { label: "Average Score", value: averageScore.toFixed(1) },
      { label: "Current Streak", value: `${currentStreak}d` }
    ],
    [averageScore, currentStreak, sessions.length]
  );

  const loadSessions = useCallback(
    async ({ force = false } = {}) => {
      if (hasLoadedSessions && !force) {
        setIsLoading(false);
        return;
      }

      try {
        setErrorMessage("");

        if (force) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const nextSessions = await fetchUserSessions();
        setCachedSessions(nextSessions);
      } catch (error) {
        setErrorMessage(error.message || "Could not load your progress yet. Pull to refresh.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [hasLoadedSessions, setCachedSessions]
  );

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const refreshSessions = useCallback(() => {
    loadSessions({ force: true });
  }, [loadSessions]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refreshSessions}
          tintColor={COLORS.accent}
          colors={[COLORS.accent]}
        />
      }
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Your Progress
        </Text>
        <Text selectable style={styles.subtitle}>
          Last 7 days practice snapshot
        </Text>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text selectable style={styles.statValue}>
              {stat.value}
            </Text>
            <Text selectable style={styles.statLabel}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingCard}>
          <SkeletonBox style={styles.loadingSkeletonTitle} />
          <SkeletonBox style={styles.loadingSkeletonLine} />
          <SkeletonBox style={[styles.loadingSkeletonLine, styles.loadingSkeletonShort]} />
        </View>
      ) : null}

      {errorMessage ? (
        <Text selectable style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      <View style={styles.card}>
        <Text selectable style={styles.sectionTitle}>
          Last 7 Days Performance
        </Text>
        <Text selectable style={styles.cardSubtext}>
          Rolling view ending today.
        </Text>
        {!sessions.length ? (
          <EmptyPanel
            title="No scored sessions yet"
            message="Complete a mock interview to start building your last 7 days chart."
          />
        ) : null}
        <View style={styles.chartWrap}>
          <View style={styles.yAxis}>
            {[10, 8, 6, 4, 2, 0].map((tick) => (
              <Text key={tick} selectable style={styles.axisLabel}>
                {tick}
              </Text>
            ))}
          </View>
          <View style={styles.chartArea}>
            <View style={styles.gridLineTop} />
            <View style={styles.gridLineMiddle} />
            <View style={styles.gridLineBottom} />
            <View style={styles.barRow}>
              {weeklyScores.map((item, index) => (
                <View key={`${item.day}-${index}`} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${item.score * 10}%` }]} />
                  </View>
                  <Text selectable style={styles.scoreLabel}>
                    {item.score.toFixed(1)}
                  </Text>
                  <Text selectable style={styles.dayText}>
                    {index === weeklyScores.length - 1 ? "Today" : item.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text selectable style={styles.sectionTitle}>
          Strong Topics
        </Text>
        {strongTopics.length ? (
          <View style={styles.badgeRow}>
            {strongTopics.map((topic) => (
              <TopicBadge key={topic.label} label={topic.label} tone="strong" />
            ))}
          </View>
        ) : (
          <EmptyPanel
            title="Still learning your strengths"
            message="Score above 7 in a few sessions and your strongest categories will appear here."
          />
        )}
      </View>

      <View style={styles.card}>
        <Text selectable style={styles.sectionTitle}>
          Needs Improvement
        </Text>
        {improvementTopics.length ? (
          <View style={styles.badgeRow}>
            {improvementTopics.map((topic) => (
              <TopicBadge key={topic.label} label={topic.label} tone="improvement" />
            ))}
          </View>
        ) : (
          <EmptyPanel
            title="No weak topics yet"
            message="After a few scored sessions, categories that need attention will show up here."
          />
        )}
      </View>

      <View style={styles.card}>
        <Text selectable style={styles.sectionTitle}>
          Last 7 Days Streak
        </Text>
        <Text selectable style={styles.cardSubtext}>
          Rolling view ending today.
        </Text>
        <View style={styles.calendarRow}>
          {weeklyScores.map((item, index) => (
            <View key={`${item.day}-${index}`} style={styles.dayItem}>
              <View style={[styles.dayCircle, item.practiced && styles.dayCircleFilled]} />
              <Text selectable style={styles.dayLabel}>
                {index === weeklyScores.length - 1 ? "Today" : item.day}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  axisLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 15
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "900"
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
    gap: 7,
    justifyContent: "flex-end"
  },
  barFill: {
    backgroundColor: COLORS.accent,
    borderRadius: 7,
    bottom: 0,
    left: 0,
    minHeight: 8,
    position: "absolute",
    right: 0
  },
  barRow: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    zIndex: 1
  },
  barTrack: {
    backgroundColor: "rgba(108, 99, 255, 0.14)",
    borderRadius: 7,
    flex: 1,
    minHeight: 140,
    overflow: "hidden",
    width: "100%"
  },
  calendarRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 18
  },
  chartArea: {
    flex: 1,
    minHeight: 210,
    position: "relative"
  },
  chartWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 230,
    overflow: "hidden"
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1
  },
  content: {
    gap: 20,
    padding: 20,
    paddingBottom: 36
  },
  dayCircle: {
    borderColor: COLORS.accent,
    borderRadius: 14,
    borderWidth: 2,
    height: 28,
    width: 28
  },
  dayCircleFilled: {
    backgroundColor: COLORS.accent
  },
  dayItem: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    minWidth: 34
  },
  dayLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  dayText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800"
  },
  cardSubtext: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center"
  },
  emptyPanel: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: COLORS.border,
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 6,
    padding: 14
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center"
  },
  errorText: {
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
  gridLineBottom: {
    backgroundColor: "#242424",
    bottom: 50,
    height: 1,
    left: 0,
    position: "absolute",
    right: 0
  },
  gridLineMiddle: {
    backgroundColor: "#242424",
    bottom: 120,
    height: 1,
    left: 0,
    position: "absolute",
    right: 0
  },
  gridLineTop: {
    backgroundColor: "#242424",
    height: 1,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  header: {
    gap: 6,
    paddingTop: 8
  },
  improvementBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.42)"
  },
  improvementText: {
    color: "#FCA5A5"
  },
  loadingCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    justifyContent: "center",
    minHeight: 120,
    padding: 18
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center"
  },
  loadingSkeletonLine: {
    height: 18,
    width: "82%"
  },
  loadingSkeletonShort: {
    width: "54%"
  },
  loadingSkeletonTitle: {
    height: 24,
    width: "64%"
  },
  scoreLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "900"
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900"
  },
  statCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    justifyContent: "center",
    minHeight: 98,
    paddingHorizontal: 8,
    paddingVertical: 14
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
    textAlign: "center"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10
  },
  statValue: {
    color: COLORS.text,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 30,
    textAlign: "center"
  },
  strongBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderColor: "rgba(34, 197, 94, 0.42)"
  },
  strongText: {
    color: "#86EFAC"
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700"
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 39
  },
  yAxis: {
    height: 170,
    justifyContent: "space-between",
    paddingTop: 1
  }
});
