import { useCallback, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import AppCard from "../components/ui/AppCard";
import AppIcon from "../components/ui/AppIcon";
import AppText from "../components/ui/AppText";
import EmptyState from "../components/ui/EmptyState";
import InsightCard from "../components/ui/InsightCard";
import LoadingState from "../components/ui/LoadingState";
import MetricCard from "../components/ui/MetricCard";
import MessageCard from "../components/ui/MessageCard";
import ProgressBar from "../components/ui/ProgressBar";
import Screen from "../components/ui/Screen";
import ScreenHero from "../components/ui/ScreenHero";
import SectionHeader from "../components/ui/SectionHeader";
import { useAppTheme } from "../theme";
import {
  calculateAverageScore,
  calculateCurrentStreak,
  fetchUserSessions,
  getLastSevenDayScores
} from "../services/sessionService";
import { useProgressStore } from "../store/progressStore";

function TopicInsight({ topic, tone }) {
  const isStrong = tone === "strong";

  return (
    <InsightCard
      icon={isStrong ? "success" : "target"}
      title={topic.label}
      tone={isStrong ? "success" : "warning"}
    >
      <View style={styles.topicMeta}>
        <AppText tone="muted" variant="bodyMuted">
          {topic.average.toFixed(1)}/10 average - {topic.count} session
          {topic.count === 1 ? "" : "s"}
        </AppText>
      </View>
    </InsightCard>
  );
}

function EmptyPanel({ title, message }) {
  return <EmptyState icon="chart" message={message} style={styles.emptyPanel} title={title} />;
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

const clampScore = (score) => Math.min(Math.max(Number(score || 0), 0), 10);

export default function ProgressScreen() {
  const { colors } = useAppTheme();
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
      { icon: "practice", label: "Sessions", value: String(sessions.length) },
      { icon: "star", label: "Average", value: averageScore.toFixed(1) },
      { icon: "calendar", label: "Streak", value: `${currentStreak}d` }
    ],
    [averageScore, currentStreak, sessions.length]
  );

  const loadSessions = useCallback(
    async ({ force = false, silent = false } = {}) => {
      if (hasLoadedSessions && !force) {
        setIsLoading(false);
        return;
      }

      try {
        setErrorMessage("");

        if (silent) {
          setIsRefreshing(false);
        } else if (force) {
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
      loadSessions({ force: true, silent: hasLoadedSessions });
    }, [hasLoadedSessions, loadSessions])
  );

  const refreshSessions = useCallback(() => {
    loadSessions({ force: true });
  }, [loadSessions]);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refreshSessions}
          tintColor={colors.secondary}
          colors={[colors.secondary]}
        />
      }
      contentContainerStyle={styles.content}
    >
      <ScreenHero
        badge="Progress dashboard"
        badgeIcon="chart"
        icon="chart"
        title="Interview readiness"
        subtitle="Real trends from your saved mock interview sessions."
      >
        <View
          style={[
            styles.headerScore,
            { backgroundColor: colors.secondarySoft, borderColor: colors.border }
          ]}
        >
          <AppText color={colors.secondary} variant="statNumber">
            {averageScore.toFixed(1)}
          </AppText>
          <AppText tone="muted" variant="caption">
            avg
          </AppText>
        </View>
        <ProgressBar progress={averageScore / 10} />
      </ScreenHero>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <MetricCard
            key={stat.label}
            helper={
              stat.label === "Sessions"
                ? "Saved rounds"
                : stat.label === "Average"
                  ? "Out of 10"
                  : "Current run"
            }
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </View>

      {isLoading ? (
        <LoadingState message="Loading your saved interview sessions." title="Progress loading" />
      ) : null}

      {errorMessage ? (
        <MessageCard message={errorMessage} title="Progress unavailable" tone="error" />
      ) : null}

      <AppCard style={styles.card}>
        <SectionHeader
          action={<AppIcon color={colors.secondary} name="chart" size={22} />}
          subtitle="Last 7 days, rolling view ending today."
          title="Recent trend"
        />
        {!sessions.length ? (
          <EmptyPanel
            title="No scored sessions yet"
            message="Complete a mock interview to start building your last 7 days chart."
          />
        ) : (
          <View style={styles.chartWrap}>
            <View style={styles.yAxis}>
              {[10, 8, 6, 4, 2, 0].map((tick) => (
                <AppText key={tick} color={colors.muted} selectable style={styles.axisLabel}>
                  {tick}
                </AppText>
              ))}
            </View>
            <View style={styles.chartArea}>
              <View style={[styles.gridLineTop, { backgroundColor: colors.border }]} />
              <View style={[styles.gridLineMiddle, { backgroundColor: colors.border }]} />
              <View style={[styles.gridLineBottom, { backgroundColor: colors.border }]} />
              <View style={styles.barRow}>
                {weeklyScores.map((item, index) => (
                  <View key={`${item.day}-${index}`} style={styles.barColumn}>
                    <View style={[styles.barTrack, { backgroundColor: colors.secondarySoft }]}>
                      {item.practiced ? (
                        <View
                          style={[
                            styles.barFill,
                            {
                              backgroundColor: colors.secondary,
                              height: `${Math.max(clampScore(item.score) * 10, 6)}%`
                            }
                          ]}
                        />
                      ) : null}
                    </View>
                    <AppText
                      color={item.practiced ? colors.text : colors.muted}
                      selectable
                      style={styles.scoreLabel}
                      variant="caption"
                    >
                      {item.practiced ? item.score.toFixed(1) : "-"}
                    </AppText>
                    <AppText
                      color={colors.muted}
                      selectable
                      style={styles.dayText}
                      variant="caption"
                    >
                      {index === weeklyScores.length - 1 ? "Today" : item.day}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </AppCard>

      <AppCard style={styles.card}>
        <SectionHeader title="Strong topics" />
        {strongTopics.length ? (
          <View style={styles.topicList}>
            {strongTopics.map((topic) => (
              <TopicInsight key={topic.label} topic={topic} tone="strong" />
            ))}
          </View>
        ) : (
          <EmptyPanel
            title="Still learning your strengths"
            message="Score above 7 in a few sessions and your strongest categories will appear here."
          />
        )}
      </AppCard>

      <AppCard style={styles.card}>
        <SectionHeader title="Needs improvement" />
        {improvementTopics.length ? (
          <View style={styles.topicList}>
            {improvementTopics.map((topic) => (
              <TopicInsight key={topic.label} topic={topic} tone="improvement" />
            ))}
          </View>
        ) : (
          <EmptyPanel
            title="No weak topics yet"
            message="After a few scored sessions, categories that need attention will show up here."
          />
        )}
      </AppCard>

      <AppCard style={styles.card}>
        <SectionHeader subtitle="Rolling view ending today." title="Last 7 days streak" />
        <View style={styles.calendarRow}>
          {weeklyScores.map((item, index) => (
            <View key={`${item.day}-${index}`} style={styles.dayItem}>
              <View
                style={[
                  styles.dayCircle,
                  { borderColor: item.practiced ? colors.secondary : colors.borderStrong },
                  item.practiced && {
                    backgroundColor: colors.secondarySoft
                  }
                ]}
              >
                {item.practiced ? (
                  <AppIcon color={colors.secondary} name="check" size={14} />
                ) : null}
              </View>
              <AppText color={colors.muted} selectable style={styles.dayLabel} variant="caption">
                {index === weeklyScores.length - 1 ? "Today" : item.day}
              </AppText>
            </View>
          ))}
        </View>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  axisLabel: {
    fontSize: 10,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 15
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
    gap: 7,
    justifyContent: "flex-end"
  },
  barFill: {
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
    borderRadius: 7,
    flex: 1,
    minHeight: 112,
    overflow: "hidden",
    width: "100%"
  },
  calendarRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  card: {
    gap: 12,
    padding: 15
  },
  chartArea: {
    flex: 1,
    minHeight: 172,
    position: "relative"
  },
  chartWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 172,
    overflow: "hidden"
  },
  content: {
    gap: 14,
    paddingBottom: 108
  },
  dayCircle: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  dayItem: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    minWidth: 34
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "800"
  },
  dayText: {
    fontSize: 10,
    fontWeight: "800"
  },
  emptyPanel: {
    padding: 14
  },
  gridLineBottom: {
    bottom: 50,
    height: 1,
    left: 0,
    position: "absolute",
    right: 0
  },
  gridLineMiddle: {
    bottom: 120,
    height: 1,
    left: 0,
    position: "absolute",
    right: 0
  },
  gridLineTop: {
    height: 1,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  headerScore: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 66,
    justifyContent: "center",
    width: 66
  },
  scoreLabel: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "900"
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  topicList: {
    gap: 10
  },
  topicMeta: {
    gap: 2
  },
  yAxis: {
    height: 142,
    justifyContent: "space-between",
    paddingTop: 1
  }
});
