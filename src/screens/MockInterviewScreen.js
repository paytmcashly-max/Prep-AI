import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, ScrollView, Share, StyleSheet, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";

import FreeLimitCard from "../components/FreeLimitCard";
import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppIcon from "../components/ui/AppIcon";
import AppText from "../components/ui/AppText";
import IconButton from "../components/ui/IconButton";
import InsightCard from "../components/ui/InsightCard";
import MessageCard from "../components/ui/MessageCard";
import SkeletonLine from "../components/ui/SkeletonLine";
import TimerPill from "../components/ui/TimerPill";
import VoiceAnswerRecorder from "../components/voice/VoiceAnswerRecorder";
import { auth } from "../services/firebaseConfig";
import { trackEvent } from "../services/analyticsService";
import { evaluateAnswer, generateQuestion, transcribeVoiceAnswer } from "../services/aiService";
import { isVoiceFeatureEnabled } from "../services/featureFlags";
import { formatCountdown, getMsUntilIndiaMidnight } from "../services/quotaService";
import { saveMockInterviewSession } from "../services/sessionService";
import { useProgressStore } from "../store/progressStore";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useUserStore } from "../store/userStore";
import { useAppTheme } from "../theme";
import { MAX_VOICE_RECORDING_DURATION_MILLIS } from "../services/voiceConstants";

const DEFAULT_QUESTION_COUNT = 5;
const MAX_PREMIUM_QUESTION_COUNT = 20;
const QUESTION_TIME_SECONDS = 60;

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

const isInterviewUsageLimitError = (error) => error?.status === 429;
const getMockInterviewDraftStorageKey = (uid, category, difficulty, answerMode = "text") =>
  `mock_interview_draft:${uid}:${category}:${difficulty}:${answerMode}`;

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
  const { colors } = useAppTheme();
  const category = route?.params?.category || "HR";
  const difficulty = route?.params?.difficulty || "easy";
  const answerMode = route?.params?.answerMode || "text";
  const categoryName = useMemo(() => formatCategory(category), [category]);
  const difficultyName = useMemo(() => formatDifficulty(difficulty), [difficulty]);
  const jobRole = useUserStore((state) => state.profile.jobRole);
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const configuredQuestionCount = useMemo(
    () => normalizeQuestionCount(route?.params?.questionCount, isPremium),
    [isPremium, route?.params?.questionCount]
  );
  const [restoredQuestionCount, setRestoredQuestionCount] = useState(null);
  const totalQuestions = restoredQuestionCount ?? configuredQuestionCount;
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
  const [isReadingQuestion, setIsReadingQuestion] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [speechErrorMessage, setSpeechErrorMessage] = useState("");
  const [sessionSaveError, setSessionSaveError] = useState("");
  const [showIdealAnswer, setShowIdealAnswer] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceTranscriptMeta, setVoiceTranscriptMeta] = useState(null);
  const [isEditingVoiceTranscript, setIsEditingVoiceTranscript] = useState(false);
  const [voiceRecorderInstanceKey, setVoiceRecorderInstanceKey] = useState(0);
  const [draftPrompt, setDraftPrompt] = useState(null);
  const [resetCountdown, setResetCountdown] = useState(() =>
    formatCountdown(getMsUntilIndiaMidnight())
  );
  const previousQuestionsRef = useRef([]);
  const questionRequestInFlightRef = useRef(false);
  const draftStorageKey = useMemo(
    () =>
      getMockInterviewDraftStorageKey(
        auth.currentUser?.uid || "anonymous",
        category,
        difficulty,
        answerMode
      ),
    [answerMode, category, difficulty]
  );

  const finalScores = scoresRef.current.length ? scoresRef.current : scores;
  const averageScore = getAverageScore(finalScores);
  const hasTimedOut = Boolean(
    question &&
    !feedback &&
    !isCheckingUsage &&
    !isQuestionLoading &&
    !isEvaluating &&
    !isSessionComplete &&
    !isLimitReached &&
    secondsLeft <= 0
  );

  const clearInterviewDraft = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(draftStorageKey);
    } catch {
      // Losing a local draft cleanup should never block the interview flow.
    }
  }, [draftStorageKey]);

  const stopQuestionReadout = useCallback(async () => {
    try {
      await Speech.stop();
    } catch {
      // Stopping device speech is best-effort only.
    } finally {
      setIsReadingQuestion(false);
    }
  }, []);

  const resetInterviewState = useCallback(() => {
    setRestoredQuestionCount(null);
    setQuestionNumber(1);
    setQuestion("");
    setSecondsLeft(QUESTION_TIME_SECONDS);
    setAnswer("");
    void stopQuestionReadout();
    setFeedback(null);
    setScores([]);
    scoresRef.current = [];
    setErrorMessage("");
    setSessionSaveError("");
    setShowIdealAnswer(false);
    setIsSavingSession(false);
    setIsSessionComplete(false);
    setIsLimitReached(false);
    setVoiceTranscript("");
    setVoiceTranscriptMeta(null);
    setIsEditingVoiceTranscript(false);
    setVoiceRecorderInstanceKey((current) => current + 1);
    setSpeechErrorMessage("");
    previousQuestionsRef.current = [];
  }, [stopQuestionReadout]);

  const persistInterviewDraft = useCallback(async () => {
    if (
      !question ||
      isCheckingUsage ||
      isQuestionLoading ||
      isEvaluating ||
      isSavingSession ||
      isSessionComplete ||
      isLimitReached
    ) {
      return;
    }

    try {
      await AsyncStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          answer,
          category,
          difficulty,
          feedback,
          previousQuestions: previousQuestionsRef.current,
          question,
          questionNumber,
          savedAt: new Date().toISOString(),
          scores: scoresRef.current,
          showIdealAnswer,
          totalQuestions
        })
      );
    } catch {
      // Draft persistence is best-effort only.
    }
  }, [
    answer,
    category,
    difficulty,
    draftStorageKey,
    feedback,
    isCheckingUsage,
    isEvaluating,
    isLimitReached,
    isQuestionLoading,
    isSavingSession,
    isSessionComplete,
    question,
    questionNumber,
    showIdealAnswer,
    totalQuestions
  ]);

  const restoreInterviewDraft = useCallback(
    (draft) => {
      setRestoredQuestionCount(Number(draft?.totalQuestions) || configuredQuestionCount);
      setQuestionNumber(Number(draft?.questionNumber) || 1);
      setQuestion(draft?.question || "");
      setAnswer(draft?.answer || "");
      setFeedback(draft?.feedback || null);
      setShowIdealAnswer(Boolean(draft?.showIdealAnswer));
      setSecondsLeft(QUESTION_TIME_SECONDS);

      const nextScores = Array.isArray(draft?.scores)
        ? draft.scores.map((score) => Number(score || 0))
        : [];

      scoresRef.current = nextScores;
      setScores(nextScores);
      previousQuestionsRef.current = Array.isArray(draft?.previousQuestions)
        ? draft.previousQuestions
        : [];
      setErrorMessage("");
      setSessionSaveError("");
      setIsLimitReached(false);
      setDraftPrompt(null);
    },
    [configuredQuestionCount]
  );

  const blockForDailyLimit = useCallback(() => {
    setIsLimitReached(true);
    setQuestion("");
    setFeedback(null);
    setAnswer("");
    setSecondsLeft(QUESTION_TIME_SECONDS);
    setDraftPrompt(null);
    void clearInterviewDraft();
  }, [clearInterviewDraft]);

  const loadQuestion = useCallback(
    async (nextQuestionNumber) => {
      if (questionRequestInFlightRef.current) {
        return false;
      }

      try {
        questionRequestInFlightRef.current = true;
        setIsQuestionLoading(true);
        setErrorMessage("");
        setSpeechErrorMessage("");
        setIsLimitReached(false);
        setFeedback(null);
        setShowIdealAnswer(false);
        setAnswer("");
        await stopQuestionReadout();
        setVoiceTranscript("");
        setVoiceTranscriptMeta(null);
        setIsEditingVoiceTranscript(false);
        setVoiceRecorderInstanceKey((current) => current + 1);
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
    [blockForDailyLimit, category, difficulty, isPremium, stopQuestionReadout]
  );

  const recordQuestionScore = useCallback((score) => {
    const numericScore = Number(score);
    const safeScore = Number.isFinite(numericScore) ? numericScore : 0;
    const nextScores = [...scoresRef.current, safeScore];

    scoresRef.current = nextScores;
    setScores(nextScores);
  }, []);

  const checkUsageAndStart = useCallback(
    async (nextTotalQuestions = totalQuestions) => {
      try {
        resetInterviewState();
        setRestoredQuestionCount(nextTotalQuestions);
        setIsCheckingUsage(true);
        setErrorMessage("");
        setIsLimitReached(false);
        setDraftPrompt(null);

        trackEvent("interview_started", {
          category,
          difficulty,
          questionCount: nextTotalQuestions
        });
        await loadQuestion(1);
      } catch (error) {
        setErrorMessage(error.message || "Could not generate a question. Please try again.");
      } finally {
        setIsCheckingUsage(false);
      }
    },
    [category, difficulty, loadQuestion, resetInterviewState, totalQuestions]
  );

  useEffect(() => {
    let isActive = true;

    const initializeInterview = async () => {
      try {
        setIsCheckingUsage(true);
        setDraftPrompt(null);

        const savedDraft = await AsyncStorage.getItem(draftStorageKey);

        if (!isActive) {
          return;
        }

        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);

          if (parsedDraft?.question) {
            setDraftPrompt(parsedDraft);
            setIsCheckingUsage(false);
            return;
          }

          await clearInterviewDraft();
        }

        if (isActive) {
          await checkUsageAndStart(configuredQuestionCount);
        }
      } catch {
        if (isActive) {
          await checkUsageAndStart(configuredQuestionCount);
        }
      }
    };

    initializeInterview();

    return () => {
      isActive = false;
    };
  }, [checkUsageAndStart, clearInterviewDraft, configuredQuestionCount, draftStorageKey]);

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

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        void stopQuestionReadout();
        void persistInterviewDraft();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [persistInterviewDraft, stopQuestionReadout]);

  useEffect(
    () => () => {
      void stopQuestionReadout();
      void persistInterviewDraft();
    },
    [persistInterviewDraft, stopQuestionReadout]
  );

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
      await clearInterviewDraft();
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

  const submitAnswer = async (explicitAnswer) => {
    const answerToEvaluate =
      typeof explicitAnswer === "string" ? explicitAnswer.trim() : answer.trim();

    if (!answerToEvaluate) {
      setErrorMessage("Please type an answer before submitting.");
      return;
    }

    try {
      setIsEvaluating(true);
      setErrorMessage("");

      trackEvent("answer_submitted", { category, questionNumber });
      const result = await evaluateAnswer(question, answerToEvaluate);
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

  const continueAfterTimeout = () => {
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

    trackEvent("question_timed_out", { category, questionNumber });
    recordQuestionScore(0);
    completeOrLoadNext();
  };

  const backToHome = () => {
    navigation.navigate("MainTabs", {
      screen: "Home",
      params: { sessionCompleted: true }
    });
  };

  const continueSavedInterview = () => {
    if (!draftPrompt) {
      return;
    }

    restoreInterviewDraft(draftPrompt);
  };

  const startFreshInterview = async () => {
    await clearInterviewDraft();
    setDraftPrompt(null);
    await checkUsageAndStart(configuredQuestionCount);
  };

  const shareResult = async () => {
    try {
      await Share.share({
        message: `Mock Interview Complete!\n\nCategory: ${categoryName}\nScore: ${averageScore}/10\n\nPracticing smarter with IntervueAI.\n\n#IntervueAI #InterviewPrep #JobSearch`
      });
    } catch (error) {
      Alert.alert("Share failed", error.message || "Could not open sharing options.");
    }
  };

  const handleVoiceAudioSubmit = useCallback(
    async ({ durationMillis, mimeType, uri }) => {
      try {
        setErrorMessage("");
        trackEvent("voice_transcription_requested", {
          category,
          durationSeconds: Math.min(
            Math.max(Math.round((durationMillis || 0) / 1000), 1),
            Math.round(MAX_VOICE_RECORDING_DURATION_MILLIS / 1000)
          ),
          questionNumber
        });
        const transcription = await transcribeVoiceAnswer({
          durationMillis,
          fileName: "voice-answer.m4a",
          mimeType: mimeType || "audio/m4a",
          uri
        });

        setVoiceTranscript(transcription.transcript);
        setVoiceTranscriptMeta({
          durationSeconds: transcription.durationSeconds || Math.round(durationMillis / 10) / 100,
          language: transcription.language
        });
        setIsEditingVoiceTranscript(false);
        trackEvent("voice_transcription_completed", {
          category,
          durationSeconds: Math.max(
            Math.round((transcription.durationSeconds || durationMillis / 1000 || 0) * 10) / 10,
            0.1
          ),
          questionNumber
        });
      } catch (error) {
        setVoiceTranscript("");
        setVoiceTranscriptMeta(null);
        setIsEditingVoiceTranscript(false);
        setErrorMessage(error.message || "Could not transcribe answer.");
        trackEvent("voice_transcription_failed", {
          category,
          errorCode: error?.code || "unknown",
          questionNumber
        });
      }
    },
    [category, questionNumber]
  );

  const retakeVoiceAnswer = useCallback(() => {
    setVoiceTranscript("");
    setVoiceTranscriptMeta(null);
    setIsEditingVoiceTranscript(false);
    setVoiceRecorderInstanceKey((current) => current + 1);
    setErrorMessage("");
  }, []);

  const readQuestionAloud = useCallback(async () => {
    if (!question || isCheckingUsage || isQuestionLoading) {
      return;
    }

    try {
      setSpeechErrorMessage("");
      await stopQuestionReadout();

      Speech.speak(question, {
        language: "en",
        onDone: () => setIsReadingQuestion(false),
        onError: () => {
          setIsReadingQuestion(false);
          setSpeechErrorMessage("Could not read question aloud.");
        },
        onStopped: () => setIsReadingQuestion(false),
        pitch: 1,
        rate: 0.95
      });

      setIsReadingQuestion(true);
    } catch {
      setIsReadingQuestion(false);
      setSpeechErrorMessage("Could not read question aloud.");
    }
  }, [isCheckingUsage, isQuestionLoading, question, stopQuestionReadout]);

  if (draftPrompt) {
    return (
      <KeyboardAwareScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, styles.summaryContent]}
      >
        <AppCard style={styles.resumeDraftCard}>
          <View
            style={[
              styles.resumeDraftIconWrap,
              { backgroundColor: colors.primarySoft, borderColor: colors.border }
            ]}
          >
            <AppIcon color={colors.primary} name="practice" size={24} />
          </View>
          <AppText style={styles.centerText} variant="screenTitle">
            Continue your interview?
          </AppText>
          <AppText style={styles.centerText} tone="muted" variant="body">
            Your unfinished {categoryName.toLowerCase()} round is saved on this device. Pick up from
            question {draftPrompt.questionNumber || 1} or start again from the top.
          </AppText>
          <View
            style={[
              styles.resumeDraftMeta,
              { backgroundColor: colors.cardAlt, borderColor: colors.border }
            ]}
          >
            <AppText tone="muted" variant="caption">
              Saved question
            </AppText>
            <AppText numberOfLines={3} variant="bodyStrong">
              {draftPrompt.question}
            </AppText>
          </View>
          <View style={styles.resumeDraftActions}>
            <AppButton onPress={startFreshInterview} style={styles.actionButton} tone="secondary">
              Start Fresh
            </AppButton>
            <AppButton onPress={continueSavedInterview} style={styles.actionButton}>
              Continue Interview
            </AppButton>
          </View>
        </AppCard>
      </KeyboardAwareScrollView>
    );
  }

  if (isSessionComplete) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, styles.summaryContent]}
      >
        <AppCard style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIconBubble,
              { backgroundColor: colors.successSoft, borderColor: colors.success }
            ]}
          >
            <AppIcon color={colors.success} name="success" size={40} />
          </View>
          <AppText style={styles.centerText} variant="screenTitle">
            Session Complete
          </AppText>
          <AppText style={styles.centerText} tone="muted" variant="body">
            You completed {totalQuestions} interview questions for {jobRole || "your role"}.
          </AppText>
          <View
            style={[
              styles.averageScoreBox,
              {
                backgroundColor: colors.cardAlt,
                borderColor: colors.primary
              }
            ]}
          >
            <AppText color={colors.primary} variant="statNumber">
              {averageScore}/10
            </AppText>
            <AppText tone="muted" variant="caption">
              Average Score
            </AppText>
          </View>
          {sessionSaveError ? (
            <MessageCard title="Progress not saved" message={sessionSaveError} tone="error" />
          ) : null}
          <View
            style={[
              styles.shareCard,
              {
                backgroundColor: colors.cardAlt,
                borderColor: colors.border
              }
            ]}
          >
            <AppText tone="secondary" variant="caption">
              IntervueAI
            </AppText>
            <AppText variant="cardTitle">I just completed a mock interview</AppText>
            <View
              style={[
                styles.shareMetricRow,
                {
                  borderColor: colors.border
                }
              ]}
            >
              <AppText tone="muted" variant="caption">
                Category
              </AppText>
              <AppText variant="bodyStrong">{categoryName}</AppText>
            </View>
            <View
              style={[
                styles.shareMetricRow,
                {
                  borderColor: colors.border
                }
              ]}
            >
              <AppText tone="muted" variant="caption">
                Score
              </AppText>
              <AppText color={colors.primary} variant="statNumber">
                {averageScore}/10
              </AppText>
            </View>
            <AppText tone="muted" variant="bodyMuted">
              Practice with IntervueAI - Practice smarter. Interview better.
            </AppText>
          </View>
          <AppButton icon="share" onPress={shareResult} tone="secondary">
            Share Result
          </AppButton>
          <AppButton onPress={backToHome}>Back to Home</AppButton>
        </AppCard>
      </ScrollView>
    );
  }

  if (isLimitReached) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, styles.summaryContent]}
      >
        <FreeLimitCard
          countdownLabel="Available again"
          message="You've used today's free interview questions. Your free practice resets soon, or you can upgrade for more rounds."
          onBack={() =>
            navigation.navigate("MainTabs", {
              screen: "Practice",
              params: { dailyLimitReached: true }
            })
          }
          onUpgrade={() => navigation.navigate("Paywall")}
          resetCountdown={resetCountdown}
          secondaryLabel="Back to Practice"
          title="Daily free limit reached"
        />
      </ScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.topBar}>
        <IconButton
          accessibilityLabel="Go back"
          icon="back"
          onPress={() => navigation.goBack()}
          size={42}
        />
        <View style={styles.topMeta}>
          <AppText numberOfLines={1} variant="bodyStrong">
            {categoryName}
          </AppText>
          <AppText tone="muted" variant="bodyMuted">
            {difficultyName} - {questionNumber} of {totalQuestions}
          </AppText>
        </View>
        <TimerPill label={`${secondsLeft}s left`} />
      </View>

      <AppCard
        style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.cardHeaderRow}>
          <AppIcon color={colors.primary} name="message" size={18} />
          <AppText tone="primary" variant="caption">
            Interview prompt
          </AppText>
        </View>
        {isCheckingUsage ? (
          <View style={styles.loadingBox}>
            <SkeletonLine height={16} />
            <SkeletonLine height={16} width="70%" />
            <AppText tone="muted" variant="bodyMuted">
              Checking your practice limit...
            </AppText>
          </View>
        ) : isQuestionLoading ? (
          <View style={styles.loadingBox}>
            <SkeletonLine height={16} />
            <SkeletonLine height={16} width="70%" />
            <AppText tone="muted" variant="bodyMuted">
              Preparing your question...
            </AppText>
          </View>
        ) : !question ? (
          <View style={styles.emptyQuestionState}>
            <AppText style={styles.centerText} variant="cardTitle">
              No question loaded
            </AppText>
            <AppText style={styles.centerText} tone="muted" variant="bodyMuted">
              The interview will continue once a question is available.
            </AppText>
          </View>
        ) : (
          <AppText style={styles.questionText} variant="sectionTitle">
            {question}
          </AppText>
        )}
        {isVoiceFeatureEnabled && question && !isCheckingUsage && !isQuestionLoading ? (
          <View style={styles.questionReadoutRow}>
            <AppButton
              disabled={isReadingQuestion}
              icon="play"
              onPress={readQuestionAloud}
              style={styles.questionReadoutButton}
              tone="secondary"
            >
              Read Question
            </AppButton>
            <AppButton
              disabled={!isReadingQuestion}
              icon="stop"
              onPress={stopQuestionReadout}
              style={styles.questionReadoutButton}
              tone="secondary"
            >
              Stop Reading
            </AppButton>
          </View>
        ) : null}
        {speechErrorMessage ? <MessageCard message={speechErrorMessage} tone="error" /> : null}
      </AppCard>

      <AppCard
        style={[styles.answerSection, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.cardHeaderRow}>
          <AppIcon color={colors.primary} name="send" size={18} />
          <AppText variant="sectionTitle">Your answer</AppText>
        </View>
        <TextInput
          editable={
            !isCheckingUsage && !isQuestionLoading && !isEvaluating && !feedback && !hasTimedOut
          }
          multiline
          onChangeText={setAnswer}
          placeholder="Answer naturally. Focus on one clear example and your impact."
          placeholderTextColor={colors.muted}
          style={[
            styles.answerInput,
            { backgroundColor: colors.cardAlt, borderColor: colors.border, color: colors.text }
          ]}
          textAlignVertical="top"
          value={answer}
        />
      </AppCard>

      {isVoiceFeatureEnabled && !voiceTranscript ? (
        <VoiceAnswerRecorder
          key={voiceRecorderInstanceKey}
          disabled={
            isCheckingUsage ||
            isQuestionLoading ||
            isEvaluating ||
            isSavingSession ||
            !question ||
            Boolean(feedback) ||
            hasTimedOut
          }
          onStartRecording={stopQuestionReadout}
          onSubmitAudio={handleVoiceAudioSubmit}
        />
      ) : null}

      {isVoiceFeatureEnabled && voiceTranscript ? (
        <AppCard
          style={[
            styles.voiceTranscriptCard,
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <AppIcon color={colors.primary} name="mic" size={18} />
            <AppText variant="sectionTitle">Transcript preview</AppText>
          </View>
          <AppText tone="muted" variant="bodyMuted">
            Review the transcript, make quick edits, then send it through the same interview
            evaluation flow as a typed answer.
          </AppText>
          <View
            style={[
              styles.voiceTranscriptMetaRow,
              { backgroundColor: colors.cardAlt, borderColor: colors.border }
            ]}
          >
            <View style={styles.voiceTranscriptMetaItem}>
              <AppText tone="muted" variant="caption">
                Language
              </AppText>
              <AppText variant="bodyStrong">{voiceTranscriptMeta?.language || "en"}</AppText>
            </View>
            <View style={styles.voiceTranscriptMetaItem}>
              <AppText tone="muted" variant="caption">
                Duration
              </AppText>
              <AppText variant="bodyStrong">
                {voiceTranscriptMeta?.durationSeconds
                  ? `${Math.max(Math.round(voiceTranscriptMeta.durationSeconds), 1)}s`
                  : "--"}
              </AppText>
            </View>
          </View>
          <TextInput
            editable={isEditingVoiceTranscript && !isEvaluating}
            multiline
            onChangeText={setVoiceTranscript}
            placeholder="Transcript will appear here."
            placeholderTextColor={colors.muted}
            style={[
              styles.answerInput,
              styles.voiceTranscriptInput,
              { backgroundColor: colors.cardAlt, borderColor: colors.border, color: colors.text }
            ]}
            textAlignVertical="top"
            value={voiceTranscript}
          />
          <View style={styles.buttonRow}>
            <AppButton
              onPress={() => setIsEditingVoiceTranscript((current) => !current)}
              style={styles.actionButton}
              tone="secondary"
            >
              Edit Transcript
            </AppButton>
            <AppButton
              disabled={isEvaluating || !voiceTranscript.trim()}
              loading={isEvaluating}
              onPress={() => submitAnswer(voiceTranscript)}
              style={styles.actionButton}
            >
              Submit Transcript
            </AppButton>
          </View>
          <AppButton onPress={retakeVoiceAnswer} style={styles.voiceRetakeButton} tone="secondary">
            Retake Voice Answer
          </AppButton>
        </AppCard>
      ) : null}

      {errorMessage ? <MessageCard message={errorMessage} tone="error" /> : null}

      {hasTimedOut ? (
        <AppCard
          style={[
            styles.timeoutCard,
            { backgroundColor: colors.warningSoft, borderColor: colors.warning }
          ]}
        >
          <View style={styles.timeoutHeader}>
            <View
              style={[
                styles.timeoutIconWrap,
                { backgroundColor: colors.card, borderColor: colors.warning }
              ]}
            >
              <AppIcon color={colors.warning} name="timer" size={18} />
            </View>
            <View style={styles.timeoutCopy}>
              <AppText variant="cardTitle">Time is up</AppText>
              <AppText tone="muted" variant="bodyMuted">
                This response will count as skipped. Move on when you are ready.
              </AppText>
            </View>
          </View>
          <View style={styles.timeoutMetaRow}>
            <View
              style={[
                styles.timeoutMetaPill,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <AppText tone="muted" variant="caption">
                Score
              </AppText>
              <AppText variant="bodyStrong">0/10</AppText>
            </View>
            <View
              style={[
                styles.timeoutMetaPill,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <AppText tone="muted" variant="caption">
                Next
              </AppText>
              <AppText variant="bodyStrong">
                {questionNumber >= totalQuestions ? "Summary" : "Question"}
              </AppText>
            </View>
          </View>
          <AppButton
            disabled={isSavingSession}
            loading={isSavingSession}
            onPress={continueAfterTimeout}
          >
            {questionNumber >= totalQuestions ? "View Summary" : "Continue"}
          </AppButton>
        </AppCard>
      ) : !feedback ? (
        <View style={styles.buttonRow}>
          <AppButton
            disabled={
              isCheckingUsage || isQuestionLoading || isEvaluating || isSavingSession || !question
            }
            onPress={skipQuestion}
            style={styles.actionButton}
            tone="secondary"
          >
            Skip Question
          </AppButton>

          <AppButton
            disabled={isCheckingUsage || isQuestionLoading || isEvaluating || !question}
            loading={isEvaluating}
            onPress={submitAnswer}
            style={styles.actionButton}
          >
            Submit Answer
          </AppButton>
        </View>
      ) : null}

      {feedback ? (
        <AppCard
          style={[
            styles.feedbackCard,
            { backgroundColor: colors.card, borderColor: colors.primary }
          ]}
          tone="accent"
        >
          <View style={styles.feedbackHeader}>
            <View style={styles.feedbackTitleGroup}>
              <AppText variant="sectionTitle">Answer feedback</AppText>
              <AppText tone="muted" variant="bodyMuted">
                Review the score, then improve one part at a time.
              </AppText>
            </View>
          </View>

          <View
            style={[
              styles.feedbackScorePanel,
              { backgroundColor: colors.card, borderColor: colors.border }
            ]}
          >
            <View
              style={[
                styles.feedbackScoreIcon,
                { backgroundColor: colors.primarySoft, borderColor: colors.border }
              ]}
            >
              <AppIcon color={colors.primary} name="star" size={20} />
            </View>
            <View style={styles.feedbackScoreCopy}>
              <AppText tone="muted" variant="caption">
                Coaching score
              </AppText>
              <AppText variant="sectionTitle">{feedback.score}/10</AppText>
            </View>
            <AppText style={styles.feedbackScoreHint} tone="muted" variant="bodyMuted">
              Focus on the highest-impact improvement first.
            </AppText>
          </View>

          <InsightCard icon="success" title="What worked" tone="success">
            {(feedback.strengths || []).map((strength) => (
              <View key={strength} style={styles.feedbackBullet}>
                <AppIcon color={colors.success} name="check" size={16} />
                <AppText style={styles.feedbackBulletText} tone="muted" variant="bodyMuted">
                  {strength}
                </AppText>
              </View>
            ))}
          </InsightCard>

          <InsightCard icon="target" title="What to improve" tone="warning">
            {(feedback.improvements || []).map((improvement) => (
              <View key={improvement} style={styles.feedbackBullet}>
                <AppIcon color={colors.warning} name="target" size={16} />
                <AppText style={styles.feedbackBulletText} tone="muted" variant="bodyMuted">
                  {improvement}
                </AppText>
              </View>
            ))}
          </InsightCard>

          <AppButton
            onPress={() => setShowIdealAnswer((current) => !current)}
            rightIcon={showIdealAnswer ? "up" : "down"}
            tone="secondary"
          >
            {showIdealAnswer ? "Hide Ideal Answer" : "Try saying it like this"}
          </AppButton>

          {showIdealAnswer ? (
            <InsightCard icon="sparkles" title="Ideal answer" tone="default">
              <AppText variant="body">{feedback.idealAnswer}</AppText>
            </InsightCard>
          ) : null}

          <AppButton
            disabled={isSavingSession}
            loading={isSavingSession}
            onPress={completeOrLoadNext}
          >
            {questionNumber >= totalQuestions ? "View Summary" : "Next Question"}
          </AppButton>
        </AppCard>
      ) : null}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  answerInput: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 112,
    padding: 13
  },
  answerSection: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  averageScoreBox: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 15
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  actionButton: {
    flex: 1,
    minWidth: 150
  },
  container: {
    flex: 1
  },
  content: {
    gap: 13,
    padding: 16,
    paddingBottom: 108
  },
  emptyQuestionState: {
    alignItems: "center",
    gap: 8
  },
  feedbackCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 13,
    padding: 15
  },
  feedbackHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  feedbackScoreCopy: {
    gap: 2
  },
  feedbackScoreHint: {
    flex: 1,
    minWidth: 0
  },
  feedbackScoreIcon: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  feedbackScorePanel: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12
  },
  feedbackTitleGroup: {
    flex: 1,
    gap: 4
  },
  feedbackBullet: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  feedbackBulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22
  },
  loadingBox: {
    alignSelf: "stretch",
    gap: 12
  },
  questionCard: {
    alignItems: "flex-start",
    borderRadius: 16,
    borderWidth: 1,
    gap: 11,
    justifyContent: "flex-start",
    minHeight: 118,
    padding: 15
  },
  questionText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: "left"
  },
  questionReadoutButton: {
    flex: 1,
    minWidth: 136
  },
  questionReadoutRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%"
  },
  voiceRetakeButton: {
    width: "100%"
  },
  voiceTranscriptCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  voiceTranscriptInput: {
    minHeight: 132
  },
  voiceTranscriptMetaItem: {
    flex: 1,
    gap: 4
  },
  voiceTranscriptMetaRow: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12
  },
  resumeDraftActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  resumeDraftCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    padding: 16
  },
  resumeDraftIconWrap: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  resumeDraftMeta: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    padding: 12
  },
  shareCard: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 18
  },
  shareMetricRow: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    padding: 16
  },
  summaryIconBubble: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    width: 54
  },
  summaryContent: {
    flexGrow: 1,
    justifyContent: "center"
  },
  timeoutCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  timeoutCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  timeoutHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12
  },
  timeoutIconWrap: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  timeoutMetaPill: {
    borderRadius: 999,
    borderWidth: 1,
    gap: 2,
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  timeoutMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
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
  },
  centerText: {
    textAlign: "center"
  }
});
