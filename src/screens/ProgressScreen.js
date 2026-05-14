import { useCallback, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppIcon from "../components/ui/AppIcon";
import AppText from "../components/ui/AppText";
import EmptyState from "../components/ui/EmptyState";
import InsightCard from "../components/ui/InsightCard";
import LoadingState from "../components/ui/LoadingState";
import MessageCard from "../components/ui/MessageCard";
import MetricCard from "../components/ui/MetricCard";
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

function EmptyPanel({ title, message }) {
  return <EmptyState icon="chart" message={message} style={styles.emptyPanel} title={title} />;
}

function TopicInsightRow({ label, average, count, tone }) {
  const { colors } = useAppTheme();
  const isStrong = tone === "strong";

  return (
    <View
      style={[
        styles.topicRow,
        {
          backgroundColor: colors.cardAlt,
          borderColor: colors.border
        }
      ]}
    >
      <View style={styles.topicCopy}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText tone="muted" variant="bodyMuted">
          {average.toFixed(1)}/10 average • {count} session{count === 1 ? "" : "s"}
        </AppText>
      </View>
      <View
        style={[
          styles.topicStatusPill,
          {
            backgroundColor: isStrong ? colors.successSoft : colors.warningSoft,
            borderColor: isStrong ? colors.success : colors.warning
          }
        ]}
      >
        <AppText color={isStrong ? colors.success : colors.warning} variant="caption">
          {isStrong ? "Strong" : "Needs work"}
        </AppText>
      </View>
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

const clampScore = (score) => Math.min(Math.max(Number(score || 0), 0), 10);

const getReadinessLabel = (sessionsCount, averageScore) => {
  if (!sessionsCount) {
    return "Start your first mock";
  }

  if (averageScore < 5) {
    return "Building basics";
  }

  if (averageScore < 7) {
    return "Improving";
  }

  if (averageScore < 8.5) {
    return "Interview ready";
  }

  return "Strong candidate";
};

const getReadinessSubtitle = (sessionsCount, averageScore) => {
  if (!sessionsCount) {
    return "Complete one mock interview to unlock your score trend, strengths, and focus areas.";
  }

  if (averageScore < 5) {
    return "You are building your foundation. A few focused rounds will sharpen clarity and confidence.";
  }

  if (averageScore < 7) {
    return "Your answers are improving. Keep practicing weaker topics to raise your next interview score.";
  }

  if (averageScore < 8.5) {
    return "You are performing well. Keep refining weaker areas to stay interview ready.";
  }

  return "You are showing strong interview performance. Stay consistent and protect your edge.";
};

export default function ProgressScreen({ navigation }) {
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
    () => sessionTopics.filter((topic) => topic.average >= 7).slice(0, 2),
    [sessionTopics]
  );
  const improvementTopics = useMemo(
    () =>
      sessionTopics
        .filter((topic) => topic.average < 7)
        .sort((a, b) => a.average - b.average)
        .slice(0, 2),
    [sessionTopics]
  );
  const readinessLabel = useMemo(
    () => getReadinessLabel(sessions.length, averageScore),
    [averageScore, sessions.length]
  );
  const readinessSubtitle = useMemo(
    () => getReadinessSubtitle(sessions.length, averageScore),
    [averageScore, sessions.length]
  );
  const lowestTopic = improvementTopics[0];
  const hasCachedSessions = sessions.length > 0;
  const stats = useMemo(
    () => [
      {
        helper: "Completed mocks",
        icon: "practice",
        label: "Sessions",
        value: String(sessions.length)
      },
      {
        helper: "Overall score",
        icon: "star",
        label: "Average",
        value: averageScore.toFixed(1)
      },
      {
        helper: "Practice run",
        icon: "calendar",
        label: "Streak",
        value: `${currentStreak}d`
      }
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
        title="Your interview progress"
        subtitle={readinessSubtitle}
      >
        <View style={styles.heroScoreRow}>
          <AppText color={colors.secondary} variant="statNumber">
            {averageScore.toFixed(1)}
          </AppText>
          <View
            style={[
              styles.readinessPill,
              { backgroundColor: colors.secondarySoft, borderColor: colors.border }
            ]}
          >
            <AppText color={colors.secondary} variant="caption">
              {readinessLabel}
            </AppText>
          </View>
        </View>
        <ProgressBar progress={averageScore / 10} />
      </ScreenHero>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <MetricCard
            key={stat.label}
            helper={stat.helper}
            icon={stat.icon}
            label={stat.label}
            style={styles.statCard}
            value={stat.value}
          />
        ))}
      </View>

      {isLoading && !hasCachedSessions ? (
        <LoadingState message="Loading your saved interview sessions." title="Progress loading" />
      ) : null}

      {errorMessage ? (
        <MessageCard
          message={errorMessage}
          title={hasCachedSessions ? "Showing saved progress" : "Progress unavailable"}
          tone="error"
        />
      ) : null}

      <AppCard style={styles.focusCard}>
        <SectionHeader title="Today's focus" />
        {!sessions.length ? (
          <View style={styles.focusContent}>
            <AppText variant="cardTitle">Start with your first mock</AppText>
            <AppText tone="muted" variant="bodyMuted">
              Complete one mock interview to unlock trends and topic insights.
            </AppText>
            {navigation ? (
              <AppButton onPress={() => navigation.navigate("Practice")}>Start practice</AppButton>
            ) : null}
          </View>
        ) : lowestTopic ? (
          <InsightCard icon="target" title={`Practice ${lowestTopic.label} today`} tone="warning">
            <AppText tone="muted" variant="bodyMuted">
              Your average here is {lowestTopic.average.toFixed(1)}/10. One focused round can
              improve your next interview.
            </AppText>
          </InsightCard>
        ) : (
          <InsightCard icon="success" title="Keep your streak alive" tone="success">
            <AppText tone="muted" variant="bodyMuted">
              You are doing well. Complete one mock today to keep momentum.
            </AppText>
          </InsightCard>
        )}
      </AppCard>

      {!sessions.length ? (
        <AppCard style={styles.card}>
          <EmptyState
            icon="chart"
            message="Complete your first mock interview and your score trend, strengths, and focus areas will appear here."
            title="No progress yet"
          />
        </AppCard>
      ) : (
        <>
          <AppCard style={styles.card}>
            <SectionHeader
              action={<AppIcon color={colors.secondary} name="chart" size={22} />}
              subtitle="Last 7 days, rolling view ending today."
              title="Recent trend"
            />
            <View style={styles.chartArea}>
              <View style={[styles.gridLineTop, { backgroundColor: colors.border }]} />
              <View style={[styles.gridLineMiddle, { backgroundColor: colors.border }]} />
              <View style={[styles.gridLineBottom, { backgroundColor: colors.border }]} />
              <View style={styles.barRow}>
                {weeklyScores.map((item, index) => (
                  <View key={`${item.day}-${index}`} style={styles.barColumn}>
                    <View
                      style={[
                        styles.barTrack,
                        {
                          backgroundColor: item.practiced ? colors.secondarySoft : colors.cardAlt,
                          borderColor: item.practiced ? colors.borderStrong : colors.border
                        }
                      ]}
                    >
                      {item.practiced ? (
                        <View
                          style={[
                            styles.barFill,
                            {
                              backgroundColor: colors.secondary,
                              height: `${Math.max(clampScore(item.score) * 10, 10)}%`
                            }
                          ]}
                        />
                      ) : (
                        <View
                          style={[styles.noPracticeDot, { backgroundColor: colors.borderStrong }]}
                        />
                      )}
                    </View>
                    <AppText
                      color={item.practiced ? colors.text : colors.muted}
                      selectable
                      style={styles.scoreLabel}
                      variant="caption"
                    >
                      {item.practiced ? item.score.toFixed(1) : "Rest"}
                    </AppText>
                    <AppText
                      color={index === weeklyScores.length - 1 ? colors.text : colors.muted}
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
          </AppCard>

          <AppCard style={styles.card}>
            <SectionHeader
              subtitle="What to keep doing and what to practice next."
              title="Topic insights"
            />
            {strongTopics.length ? (
              <View style={styles.topicSection}>
                <AppText variant="cardTitle">Strongest</AppText>
                <View style={styles.topicList}>
                  {strongTopics.map((topic) => (
                    <TopicInsightRow
                      key={topic.label}
                      average={topic.average}
                      count={topic.count}
                      label={topic.label}
                      tone="strong"
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {improvementTopics.length ? (
              <View style={styles.topicSection}>
                <AppText variant="cardTitle">Needs work</AppText>
                <View style={styles.topicList}>
                  {improvementTopics.map((topic) => (
                    <TopicInsightRow
                      key={topic.label}
                      average={topic.average}
                      count={topic.count}
                      label={topic.label}
                      tone="warning"
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {!strongTopics.length && !improvementTopics.length ? (
              <EmptyPanel
                title="Topic insights will appear soon"
                message="Complete more scored sessions and we will show what you are best at and what to practice next."
              />
            ) : null}
          </AppCard>

          <AppCard style={styles.card}>
            <SectionHeader title="Practice consistency" />
            <AppText tone="muted" variant="bodyMuted">
              {currentStreak > 0
                ? `You are on a ${currentStreak}-day streak.`
                : "Practice today to start a streak."}
            </AppText>
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
                  <AppText
                    color={colors.muted}
                    selectable
                    style={styles.dayLabel}
                    variant="caption"
                  >
                    {index === weeklyScores.length - 1 ? "Today" : item.day}
                  </AppText>
                </View>
              ))}
            </View>
          </AppCard>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  barColumn: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    justifyContent: "flex-end",
    minWidth: 0
  },
  barFill: {
    borderRadius: 9,
    bottom: 0,
    left: 0,
    minHeight: 10,
    position: "absolute",
    right: 0
  },
  barRow: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    zIndex: 1
  },
  barTrack: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 132,
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
    minHeight: 188,
    position: "relative"
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
    fontSize: 11,
    fontWeight: "800"
  },
  emptyPanel: {
    padding: 14
  },
  focusCard: {
    gap: 10
  },
  focusContent: {
    gap: 12
  },
  gridLineBottom: {
    bottom: 56,
    height: 1,
    left: 0,
    position: "absolute",
    right: 0
  },
  gridLineMiddle: {
    bottom: 124,
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
  heroScoreRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  noPracticeDot: {
    borderRadius: 999,
    height: 10,
    width: 10
  },
  readinessPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  scoreLabel: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    minHeight: 16
  },
  statCard: {
    minWidth: 0,
    padding: 12
  },
  statsRow: {
    flexDirection: "row",
    gap: 10
  },
  topicCopy: {
    flex: 1,
    gap: 2
  },
  topicList: {
    gap: 10
  },
  topicRow: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12
  },
  topicSection: {
    gap: 10
  },
  topicStatusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  }
});
