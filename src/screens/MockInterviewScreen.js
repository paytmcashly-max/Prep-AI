import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import FreeLimitCard from "../components/FreeLimitCard";
import HapticPressable from "../components/HapticPressable";
import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import SkeletonBox from "../components/SkeletonBox";
import AppIcon from "../components/ui/AppIcon";
import "../services/firebaseConfig";
import { trackEvent } from "../services/analyticsService";
import { evaluateAnswer, generateQuestion } from "../services/aiService";
import { formatCountdown, getMsUntilIndiaMidnight } from "../services/quotaService";
import { saveMockInterviewSession } from "../services/sessionService";
import { useProgressStore } from "../store/progressStore";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useUserStore } from "../store/userStore";
import { DARK_COLORS as COLORS } from "../theme";

const DEFAULT_QUESTION_COUNT = 5;
const MAX_PREMIUM_QUESTION_COUNT = 20;
const QUESTION_TIME_SECONDS = 60;
const TIMER_SIZE = 62;
const TIMER_STROKE_WIDTH = 5;
const TIMER_RADIUS = (TIMER_SIZE - TIMER_STROKE_WIDTH) / 2;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const formatDifficulty = (difficulty) => {
  if (difficulty === "hard") {
    return "Hard";
  }

  if (difficulty === "medium") {
    return "Medium";
  }

  return "Easy";
};

const formatCategory = (category) => {
  if (!category) {
    return "Mock Interview";
  }

  if (category === "HR") {
    return "HR Questions";
  }

  if (category === "Technical") {
    return "Technical Questions";
  }

  if (category === "Behavioral") {
    return "Behavioral";
  }

  if (category === "Company") {
    return "Company Specific";
  }

  return category;
};

const normalizeQuestionCount = (questionCount, isPremium) => {
  const parsedCount = Number(questionCount);

  if (!isPremium || !Number.isFinite(parsedCount)) {
    return DEFAULT_QUESTION_COUNT;
  }

  return Math.max(DEFAULT_QUESTION_COUNT, Math.min(MAX_PREMIUM_QUESTION_COUNT, parsedCount));
};

const getAverageScore = (scores) => {
  if (!scores.length) {
    return "0.0";
  }

  const total = scores.reduce((sum, score) => sum + Number(score || 0), 0);
  return (total / scores.length).toFixed(1);
};

const isInterviewUsageLimitError = (error) =>
  error?.status === 429 ||
  String(error?.message || "")
    .toLowerCase()
    .includes("free interview questions");

function CircularTimer({ secondsLeft }) {
  const progress = useRef(new Animated.Value(1)).current;
  const colorProgress = useRef(new Animated.Value(0)).current;
  const animatedTimerColor = colorProgress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [COLORS.green, COLORS.yellow, COLORS.red]
  });
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [TIMER_CIRCUMFERENCE, 0]
  });

  useEffect(() => {
    Animated.timing(progress, {
      duration: 450,
      easing: Easing.out(Easing.quad),
      toValue: secondsLeft / QUESTION_TIME_SECONDS,
      useNativeDriver: false
    }).start();

    Animated.timing(colorProgress, {
      duration: 350,
      easing: Easing.out(Easing.quad),
      toValue: secondsLeft < 15 ? 2 : secondsLeft <= 30 ? 1 : 0,
      useNativeDriver: false
    }).start();
  }, [colorProgress, progress, secondsLeft]);

  return (
    <View style={styles.timerRingWrap}>
      <Svg height={TIMER_SIZE} width={TIMER_SIZE} style={styles.timerSvg}>
        <Circle
          cx={TIMER_SIZE / 2}
          cy={TIMER_SIZE / 2}
          fill="transparent"
          r={TIMER_RADIUS}
          stroke="#2A2A2A"
          strokeWidth={TIMER_STROKE_WIDTH}
        />
        <AnimatedCircle
          cx={TIMER_SIZE / 2}
          cy={TIMER_SIZE / 2}
          fill="transparent"
          r={TIMER_RADIUS}
          stroke={animatedTimerColor}
          strokeDasharray={`${TIMER_CIRCUMFERENCE} ${TIMER_CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={TIMER_STROKE_WIDTH}
          transform={`rotate(-90 ${TIMER_SIZE / 2} ${TIMER_SIZE / 2})`}
        />
      </Svg>
      <View style={styles.timerCenter}>
        <Animated.Text selectable style={[styles.timerText, { color: animatedTimerColor }]}>
          {secondsLeft}s
        </Animated.Text>
        <Text selectable style={styles.timerLabel}>
          left
        </Text>
      </View>
    </View>
  );
}

function ErrorState({ message, title = "Something went wrong" }) {
  return (
    <View style={styles.errorState}>
      <Text selectable style={styles.errorTitle}>
        {title}
      </Text>
      <Text selectable style={styles.errorText}>
        {message}
      </Text>
    </View>
  );
}

const saveSession = async (avgScore, category, jobRole, questionsAttempted) => {
  await saveMockInterviewSession({
    category,
    score: Number(avgScore || 0),
    questionsAttempted,
    jobRole
  });

  useProgressStore.getState().resetProgress();
};

export default function MockInterviewScreen({ navigation, route }) {
  const category = route?.params?.category || "HR";
  const difficulty = route?.params?.difficulty || "easy";
  const categoryName = useMemo(() => formatCategory(category), [category]);
  const difficultyName = useMemo(() => formatDifficulty(difficulty), [difficulty]);
  const jobRole = useUserStore((state) => state.profile.jobRole);
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const totalQuestions = useMemo(
    () => normalizeQuestionCount(route?.params?.questionCount, isPremium),
    [isPremium, route?.params?.questionCount]
  );
  const [questionNumber, setQuestionNumber] = useState(1);
  const [question, setQuestion] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_SECONDS);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [scores, setScores] = useState([]);
  const scoresRef = useRef([]);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isCheckingUsage, setIsCheckingUsage] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionSaveError, setSessionSaveError] = useState("");
  const [showIdealAnswer, setShowIdealAnswer] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(() =>
    formatCountdown(getMsUntilIndiaMidnight())
  );
  const previousQuestionsRef = useRef([]);
  const questionRequestInFlightRef = useRef(false);

  const finalScores = scoresRef.current.length ? scoresRef.current : scores;
  const averageScore = getAverageScore(finalScores);

  const blockForDailyLimit = useCallback(() => {
    setIsLimitReached(true);
    setQuestion("");
    setFeedback(null);
    setAnswer("");
    setSecondsLeft(QUESTION_TIME_SECONDS);
  }, []);

  const loadQuestion = useCallback(
    async (nextQuestionNumber) => {
      if (questionRequestInFlightRef.current) {
        return false;
      }

      try {
        questionRequestInFlightRef.current = true;
        setIsQuestionLoading(true);
        setErrorMessage("");
        setIsLimitReached(false);
        setFeedback(null);
        setShowIdealAnswer(false);
        setAnswer("");
        setSecondsLeft(QUESTION_TIME_SECONDS);

        const nextQuestion = await generateQuestion({
          category,
          difficulty,
          previousQuestions: previousQuestionsRef.current
        });
        previousQuestionsRef.current = [...previousQuestionsRef.current, nextQuestion].slice(-10);
        setQuestion(nextQuestion);
        trackEvent("interview_question_generated", {
          category,
          difficulty,
          questionNumber: nextQuestionNumber
        });
        return true;
      } catch (error) {
        setQuestion("");

        if (!isPremium && isInterviewUsageLimitError(error)) {
          blockForDailyLimit();
          return false;
        }

        setErrorMessage(error.message || "Could not generate a question. Please try again.");
        return false;
      } finally {
        questionRequestInFlightRef.current = false;
        setIsQuestionLoading(false);
      }
    },
    [blockForDailyLimit, category, difficulty, isPremium]
  );

  const recordQuestionScore = useCallback((score) => {
    const numericScore = Number(score);
    const safeScore = Number.isFinite(numericScore) ? numericScore : 0;
    const nextScores = [...scoresRef.current, safeScore];

    scoresRef.current = nextScores;
    setScores(nextScores);
  }, []);

  const checkUsageAndStart = useCallback(async () => {
    try {
      setIsCheckingUsage(true);
      setErrorMessage("");
      setIsLimitReached(false);
      previousQuestionsRef.current = [];

      trackEvent("interview_started", { category, difficulty, questionCount: totalQuestions });
      await loadQuestion(1);
    } catch (error) {
      setErrorMessage(error.message || "Could not generate a question. Please try again.");
    } finally {
      setIsCheckingUsage(false);
    }
  }, [category, difficulty, loadQuestion, totalQuestions]);

  useEffect(() => {
    checkUsageAndStart();
  }, [checkUsageAndStart]);

  useEffect(() => {
    if (!isLimitReached || isPremium) {
      return undefined;
    }

    const updateCountdown = () => {
      setResetCountdown(formatCountdown(getMsUntilIndiaMidnight()));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [isLimitReached, isPremium]);

  useEffect(() => {
    if (
      isSessionComplete ||
      isLimitReached ||
      isCheckingUsage ||
      isQuestionLoading ||
      isEvaluating ||
      feedback ||
      !question ||
      secondsLeft <= 0
    ) {
      return undefined;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [
    feedback,
    isCheckingUsage,
    isEvaluating,
    isLimitReached,
    isQuestionLoading,
    isSessionComplete,
    question,
    secondsLeft
  ]);

  const saveCompletedSession = async () => {
    if (isSavingSession) {
      return;
    }

    try {
      setIsSavingSession(true);
      setSessionSaveError("");

      const finalScores = scoresRef.current.length ? scoresRef.current : scores;

      const avgScore = finalScores.length
        ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length
        : 0;

      await saveSession(avgScore, category, jobRole || "Not specified", totalQuestions);
    } catch (error) {
      setSessionSaveError(error.message || "Session completed, but progress could not be saved.");
    } finally {
      setIsSavingSession(false);
      setIsSessionComplete(true);
    }
  };

  const completeOrLoadNext = async () => {
    if (
      questionRequestInFlightRef.current ||
      isCheckingUsage ||
      isEvaluating ||
      isQuestionLoading ||
      isSavingSession
    ) {
      return;
    }

    if (questionNumber >= totalQuestions) {
      await saveCompletedSession();
      return;
    }
    const nextQuestionNumber = questionNumber + 1;
    const didLoadQuestion = await loadQuestion(nextQuestionNumber);

    if (didLoadQuestion) {
      setQuestionNumber(nextQuestionNumber);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setErrorMessage("Please type an answer before submitting.");
      return;
    }

    try {
      setIsEvaluating(true);
      setErrorMessage("");

      trackEvent("answer_submitted", { category, questionNumber });
      const result = await evaluateAnswer(question, answer.trim());
      const parsedScore = Number(result.score);

      if (!Number.isFinite(parsedScore)) {
        throw new Error("AI returned an invalid score. Please submit the answer again.");
      }

      setFeedback(result);
      recordQuestionScore(parsedScore);
      trackEvent("answer_evaluated", {
        category,
        questionNumber,
        score: parsedScore
      });
    } catch (error) {
      setErrorMessage(error.message || "Could not evaluate your answer. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const skipQuestion = () => {
    if (
      questionRequestInFlightRef.current ||
      isCheckingUsage ||
      isEvaluating ||
      isQuestionLoading ||
      isSavingSession ||
      !question
    ) {
      return;
    }

    recordQuestionScore(0);
    completeOrLoadNext();
  };

  const backToHome = () => {
    navigation.navigate("MainTabs", {
      screen: "Home",
      params: { sessionCompleted: true }
    });
  };

  const shareResult = async () => {
    try {
      await Share.share({
        message: `Mock Interview Complete!\n\nCategory: ${categoryName}\nScore: ${averageScore}/10\n\nPreparing for my dream job with PrepAI.\n\n#PrepAI #InterviewPrep #JobSearch`
      });
    } catch (error) {
      Alert.alert("Share failed", error.message || "Could not open sharing options.");
    }
  };

  if (isSessionComplete) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        contentContainerStyle={[styles.content, styles.summaryContent]}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconBubble}>
            <AppIcon color={COLORS.success} name="success" size={40} />
          </View>
          <Text selectable style={styles.summaryTitle}>
            Session Complete
          </Text>
          <Text selectable style={styles.summarySubtitle}>
            You completed {totalQuestions} interview questions for {jobRole || "your role"}.
          </Text>
          <View style={styles.averageScoreBox}>
            <Text selectable style={styles.averageScoreText}>
              {averageScore}/10
            </Text>
            <Text selectable style={styles.averageScoreLabel}>
              Average Score
            </Text>
          </View>
          {sessionSaveError ? (
            <ErrorState title="Progress not saved" message={sessionSaveError} />
          ) : null}
          <View style={styles.shareCard}>
            <Text selectable style={styles.shareLogo}>
              PrepAI
            </Text>
            <Text selectable style={styles.shareHeadline}>
              I just completed a mock interview
            </Text>
            <View style={styles.shareMetricRow}>
              <Text selectable style={styles.shareMetricLabel}>
                Category
              </Text>
              <Text selectable style={styles.shareMetricValue}>
                {categoryName}
              </Text>
            </View>
            <View style={styles.shareMetricRow}>
              <Text selectable style={styles.shareMetricLabel}>
                Score
              </Text>
              <Text selectable style={styles.shareScore}>
                {averageScore}/10
              </Text>
            </View>
            <Text selectable style={styles.shareFooter}>
              Practice with PrepAI - AI Interview Coach
            </Text>
          </View>
          <HapticPressable
            onPress={shareResult}
            style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
          >
            <View style={styles.shareButtonContent}>
              <AppIcon color={COLORS.text} name="share" size={18} />
              <Text style={styles.shareButtonText}>Share Result</Text>
            </View>
          </HapticPressable>
          <HapticPressable
            onPress={backToHome}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </HapticPressable>
        </View>
      </ScrollView>
    );
  }

  if (isLimitReached) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        contentContainerStyle={[styles.content, styles.summaryContent]}
      >
        <FreeLimitCard
          onBack={() =>
            navigation.navigate("MainTabs", {
              screen: "Practice",
              params: { dailyLimitReached: true }
            })
          }
          onUpgrade={() => navigation.navigate("Paywall")}
          resetCountdown={resetCountdown}
        />
      </ScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <HapticPressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.topBackButton, pressed && styles.pressed]}
        >
          <AppIcon color={COLORS.text} name="back" size={18} />
        </HapticPressable>
        <View style={styles.topMeta}>
          <Text selectable style={styles.categoryText} numberOfLines={1}>
            {categoryName}
          </Text>
          <Text selectable style={styles.counterText}>
            {difficultyName} - {questionNumber} of {totalQuestions}
          </Text>
        </View>
        <CircularTimer secondsLeft={secondsLeft} />
      </View>

      <View style={styles.questionCard}>
        <View style={styles.cardHeaderRow}>
          <AppIcon color={COLORS.accent} name="practice" size={18} />
          <Text selectable style={styles.questionLabel}>
            Interview prompt
          </Text>
        </View>
        {isCheckingUsage ? (
          <View style={styles.loadingBox}>
            <SkeletonBox style={styles.questionSkeletonLine} />
            <SkeletonBox style={[styles.questionSkeletonLine, styles.questionSkeletonShort]} />
            <Text selectable style={styles.loadingText}>
              Checking your practice limit...
            </Text>
          </View>
        ) : isQuestionLoading ? (
          <View style={styles.loadingBox}>
            <SkeletonBox style={styles.questionSkeletonLine} />
            <SkeletonBox style={[styles.questionSkeletonLine, styles.questionSkeletonShort]} />
            <Text selectable style={styles.loadingText}>
              Preparing your question...
            </Text>
          </View>
        ) : !question ? (
          <View style={styles.emptyQuestionState}>
            <Text selectable style={styles.emptyQuestionTitle}>
              No question loaded
            </Text>
            <Text selectable style={styles.emptyQuestionText}>
              The interview will continue once a question is available.
            </Text>
          </View>
        ) : (
          <Text selectable style={styles.questionText}>
            {question}
          </Text>
        )}
      </View>

      <View style={styles.answerSection}>
        <View style={styles.cardHeaderRow}>
          <AppIcon color={COLORS.accent} name="edit" size={18} />
          <Text selectable style={styles.sectionTitle}>
            Your answer
          </Text>
        </View>
        <TextInput
          editable={!isCheckingUsage && !isQuestionLoading && !isEvaluating && !feedback}
          multiline
          onChangeText={setAnswer}
          placeholder="Answer naturally. Focus on one clear example and your impact."
          placeholderTextColor={COLORS.muted}
          style={styles.answerInput}
          textAlignVertical="top"
          value={answer}
        />
      </View>

      {errorMessage ? <ErrorState message={errorMessage} /> : null}

      {!feedback ? (
        <View style={styles.buttonRow}>
          <HapticPressable
            disabled={isCheckingUsage || isQuestionLoading || isEvaluating || !question}
            onPress={submitAnswer}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isEvaluating) && styles.pressed,
              (isCheckingUsage || isQuestionLoading || isEvaluating || !question) &&
                styles.disabledButton
            ]}
          >
            {isEvaluating ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.primaryButtonText}>Submit Answer</Text>
            )}
          </HapticPressable>

          <HapticPressable
            disabled={
              isCheckingUsage || isQuestionLoading || isEvaluating || isSavingSession || !question
            }
            onPress={skipQuestion}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
              (isCheckingUsage ||
                isQuestionLoading ||
                isEvaluating ||
                isSavingSession ||
                !question) &&
                styles.disabledButton
            ]}
          >
            <Text style={styles.secondaryButtonText}>Skip Question</Text>
          </HapticPressable>
        </View>
      ) : null}

      {feedback ? (
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <View style={styles.feedbackTitleGroup}>
              <Text selectable style={styles.feedbackTitle}>
                Answer Feedback
              </Text>
              <Text selectable style={styles.feedbackSubtitle}>
                Review the score, then improve one part at a time.
              </Text>
            </View>
            <View style={styles.scorePill}>
              <Text selectable style={styles.scoreLabel}>
                Score
              </Text>
              <Text selectable style={styles.scoreText}>
                {feedback.score}/10
              </Text>
            </View>
          </View>

          <View style={styles.feedbackSection}>
            <Text selectable style={styles.feedbackSectionTitle}>
              What worked
            </Text>
            {(feedback.strengths || []).map((strength) => (
              <View key={strength} style={styles.feedbackBullet}>
                <AppIcon color={COLORS.green} name="check" size={16} />
                <Text selectable style={styles.feedbackBulletText}>
                  {strength}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.feedbackSection}>
            <Text selectable style={styles.feedbackSectionTitle}>
              What to improve
            </Text>
            {(feedback.improvements || []).map((improvement) => (
              <View key={improvement} style={styles.feedbackBullet}>
                <AppIcon color={COLORS.warning} name="target" size={16} />
                <Text selectable style={styles.feedbackBulletText}>
                  {improvement}
                </Text>
              </View>
            ))}
          </View>

          <HapticPressable
            onPress={() => setShowIdealAnswer((current) => !current)}
            style={({ pressed }) => [styles.collapsibleButton, pressed && styles.pressed]}
          >
            <Text style={styles.collapsibleButtonText}>
              {showIdealAnswer ? "Hide Ideal Answer" : "Try saying it like this"}
            </Text>
          </HapticPressable>

          {showIdealAnswer ? (
            <View style={styles.idealAnswerBox}>
              <Text selectable style={styles.idealAnswerLabel}>
                Ideal answer
              </Text>
              <Text selectable style={styles.idealAnswerText}>
                {feedback.idealAnswer}
              </Text>
            </View>
          ) : null}

          <HapticPressable
            disabled={isSavingSession}
            onPress={completeOrLoadNext}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.pressed,
              isSavingSession && styles.disabledButton
            ]}
          >
            {isSavingSession ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.nextButtonText}>
                {questionNumber >= totalQuestions ? "View Summary" : "Next Question"}
              </Text>
            )}
          </HapticPressable>
        </View>
      ) : null}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  answerInput: {
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 23,
    minHeight: 132,
    padding: 16
  },
  answerSection: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  averageScoreBox: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: COLORS.accent,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 20
  },
  averageScoreLabel: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  averageScoreText: {
    color: COLORS.accent,
    fontSize: 44,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 52
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  categoryPill: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.accent,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900"
  },
  collapsibleButton: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  collapsibleButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 36
  },
  counterText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "800"
  },
  disabledButton: {
    opacity: 0.5
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center"
  },
  errorState: {
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.35)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center"
  },
  emptyQuestionState: {
    alignItems: "center",
    gap: 8
  },
  emptyQuestionText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center"
  },
  emptyQuestionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  feedbackCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.accent,
    borderRadius: 14,
    borderWidth: 1,
    gap: 16,
    padding: 18
  },
  feedbackHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  feedbackSection: {
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  feedbackSectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900"
  },
  feedbackTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900"
  },
  feedbackSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  feedbackTitleGroup: {
    flex: 1,
    gap: 4
  },
  idealAnswerBox: {
    backgroundColor: "#111111",
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  idealAnswerLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900"
  },
  idealAnswerText: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23
  },
  feedbackBullet: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  feedbackBulletText: {
    color: COLORS.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22
  },
  loadingBox: {
    alignSelf: "stretch",
    gap: 12
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2
  },
  loadingSubText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    textAlign: "center"
  },
  nextButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  nextButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
    minWidth: 160,
    paddingHorizontal: 18
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900"
  },
  questionCard: {
    alignItems: "flex-start",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    justifyContent: "flex-start",
    minHeight: 150,
    padding: 18
  },
  questionLabel: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  questionText: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 28,
    textAlign: "left"
  },
  questionSkeletonLine: {
    height: 16,
    width: "100%"
  },
  questionSkeletonShort: {
    width: "70%"
  },
  scoreText: {
    color: COLORS.accent,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "900"
  },
  scoreLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  scorePill: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: COLORS.accent,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
    minWidth: 82,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
    minWidth: 130,
    paddingHorizontal: 18
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900"
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900"
  },
  shareButton: {
    alignItems: "center",
    backgroundColor: "#26215F",
    borderColor: COLORS.accent,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 18
  },
  shareButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  shareButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900"
  },
  shareCard: {
    backgroundColor: "#111111",
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 18
  },
  shareFooter: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center"
  },
  shareHeadline: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 26,
    textAlign: "center"
  },
  shareLogo: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
    textTransform: "uppercase"
  },
  shareMetricLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  shareMetricRow: {
    alignItems: "center",
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  shareMetricValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900"
  },
  shareScore: {
    color: COLORS.yellow,
    fontSize: 16,
    fontWeight: "900"
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 18,
    padding: 22
  },
  summaryIconBubble: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderColor: "rgba(34, 197, 94, 0.35)",
    borderRadius: 999,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  summaryContent: {
    flexGrow: 1,
    justifyContent: "center"
  },
  summarySubtitle: {
    color: COLORS.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center"
  },
  summaryTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 38,
    textAlign: "center"
  },
  timerCard: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 132,
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  timerLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 11,
    textTransform: "uppercase"
  },
  timerCenter: {
    alignItems: "center",
    gap: 2,
    justifyContent: "center",
    position: "absolute"
  },
  timerRingWrap: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 70,
    justifyContent: "center",
    width: 70
  },
  timerSvg: {
    transform: [{ rotate: "0deg" }]
  },
  timerText: {
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 19
  },
  topBackButton: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  topBackButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900"
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 8
  },
  topMeta: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  cardHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  }
});
