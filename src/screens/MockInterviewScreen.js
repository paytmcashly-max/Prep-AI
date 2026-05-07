import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getFirestore, increment, setDoc } from "firebase/firestore";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import "../services/firebaseConfig";
import { evaluateAnswer, generateQuestion } from "../services/openaiService";
import { useProgressStore } from "../store/progressStore";
import { useUserStore } from "../store/userStore";

const TOTAL_QUESTIONS = 5;
const QUESTION_TIME_SECONDS = 60;
const FREE_DAILY_QUESTION_LIMIT = 5;

const COLORS = {
  accent: "#6C63FF",
  background: "#0A0A0A",
  card: "#1A1A1A",
  muted: "#A3A3A3",
  text: "#FFFFFF",
  green: "#22C55E",
  yellow: "#FACC15",
  red: "#EF4444"
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

const getTimerColor = (secondsLeft) => {
  if (secondsLeft > 30) {
    return COLORS.green;
  }

  if (secondsLeft >= 15) {
    return COLORS.yellow;
  }

  return COLORS.red;
};

const getAverageScore = (scores) => {
  if (!scores.length) {
    return "0.0";
  }

  const total = scores.reduce((sum, score) => sum + Number(score || 0), 0);
  return (total / scores.length).toFixed(1);
};

const getTodayDateKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDailyUsageDocRef = () => {
  const db = getFirestore();
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  console.log("Daily usage uid:", uid);

  if (!uid) {
    return null;
  }

  return doc(db, "users", uid, "dailyUsage", getTodayDateKey());
};

const getQuestionsUsedToday = async () => {
  const usageRef = getDailyUsageDocRef();

  if (!usageRef) {
    return 0;
  }

  const usageSnapshot = await getDoc(usageRef);

  if (!usageSnapshot.exists()) {
    console.log("Daily usage questionsUsed:", 0);
    return 0;
  }

  const questionsUsed = Number(usageSnapshot.data().questionsUsed || 0);
  console.log("Daily usage questionsUsed:", questionsUsed);

  return questionsUsed;
};

const getQuestionsUsedTodaySafely = async () => {
  try {
    return await getQuestionsUsedToday();
  } catch (error) {
    console.log("Could not read daily usage. Continuing without blocking session.", error);
    return 0;
  }
};

const incrementQuestionsUsedToday = async () => {
  const usageRef = getDailyUsageDocRef();

  if (!usageRef) {
    return 0;
  }

  await setDoc(
    usageRef,
    {
      date: new Date(),
      questionsUsed: increment(1)
    },
    { merge: true }
  );

  const nextQuestionsUsed = await getQuestionsUsedToday();
  console.log("Daily usage after increment:", nextQuestionsUsed);

  return nextQuestionsUsed;
};

const incrementQuestionsUsedTodaySafely = async () => {
  try {
    return await incrementQuestionsUsedToday();
  } catch (error) {
    console.log("Could not update daily usage. Continuing session.", error);
    return null;
  }
};

const saveSession = async (avgScore, category, jobRole) => {
  const db = getFirestore();
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  console.log("Firestore session save uid:", uid);
  console.log("Firestore session score:", avgScore);

  if (!uid) {
    console.log("No uid found. Session was not saved.");
    return;
  }

  await addDoc(collection(db, "users", uid, "sessions"), {
    category,
    score: Number(avgScore || 0),
    questionsAttempted: 5,
    date: new Date(),
    jobRole
  });

  console.log("Session saved to Firestore!");
  useProgressStore.getState().resetProgress();
};

export default function MockInterviewScreen({ navigation, route }) {
  const category = route?.params?.category || "HR";
  const categoryName = useMemo(() => formatCategory(category), [category]);
  const jobRole = useUserStore((state) => state.profile.jobRole);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [question, setQuestion] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_SECONDS);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [scores, setScores] = useState([]);
  const scoresRef = useRef([]);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isCheckingUsage, setIsCheckingUsage] = useState(true);
  const [questionsUsedToday, setQuestionsUsedToday] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionSaveError, setSessionSaveError] = useState("");
  const [showIdealAnswer, setShowIdealAnswer] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const timerColor = getTimerColor(secondsLeft);
  const averageScore = getAverageScore(scores);

  const showDailyLimitAlert = useCallback(() => {
    Alert.alert(
      "Daily limit reached!",
      "Upgrade to Premium for unlimited questions.",
      [
        {
          text: "Maybe Later",
          style: "cancel",
          onPress: () => navigation.goBack()
        },
        {
          text: "Upgrade Now",
          onPress: () => navigation.navigate("Paywall")
        }
      ]
    );
  }, [navigation]);

  const loadQuestion = useCallback(async () => {
    try {
      setIsQuestionLoading(true);
      setErrorMessage("");
      setFeedback(null);
      setShowIdealAnswer(false);
      setAnswer("");
      setSecondsLeft(QUESTION_TIME_SECONDS);

      const nextQuestion = await generateQuestion(category, undefined, "medium");
      setQuestion(nextQuestion);
    } catch (error) {
      setQuestion("");
      setErrorMessage(error.message || "Could not generate a question. Please try again.");
    } finally {
      setIsQuestionLoading(false);
    }
  }, [category]);

  const recordQuestionScore = useCallback((score) => {
    const numericScore = Number(score);
    const safeScore = Number.isFinite(numericScore) ? numericScore : 0;
    const nextScores = [...scoresRef.current, safeScore];

    scoresRef.current = nextScores;
    console.log("Updated scores array:", nextScores);
    setScores(nextScores);
  }, []);

  const checkUsageAndStart = useCallback(async () => {
    try {
      setIsCheckingUsage(true);
      setErrorMessage("");

      const currentQuestionsUsed = await getQuestionsUsedTodaySafely();
      setQuestionsUsedToday(currentQuestionsUsed);

      if (currentQuestionsUsed >= FREE_DAILY_QUESTION_LIMIT) {
        showDailyLimitAlert();
        return;
      }

      await loadQuestion();
    } catch (error) {
      setErrorMessage(error.message || "Could not generate a question. Please try again.");
    } finally {
      setIsCheckingUsage(false);
    }
  }, [loadQuestion, showDailyLimitAlert]);

  useEffect(() => {
    checkUsageAndStart();
  }, [checkUsageAndStart]);

  useEffect(() => {
    if (
      isSessionComplete ||
      isCheckingUsage ||
      isQuestionLoading ||
      isEvaluating ||
      feedback ||
      secondsLeft <= 0
    ) {
      return undefined;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [feedback, isCheckingUsage, isEvaluating, isQuestionLoading, isSessionComplete, secondsLeft]);

  const saveCompletedSession = async () => {
    if (isSavingSession) {
      return;
    }

    try {
      setIsSavingSession(true);
      setSessionSaveError("");

      const finalScores = scoresRef.current.length ? scoresRef.current : scores;
      console.log("Individual question scores:", finalScores);

      const avgScore = finalScores.length
        ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length
        : 0;
      console.log("Final avg score:", avgScore);

      await saveSession(avgScore, category, jobRole || "Not specified");
    } catch (error) {
      setSessionSaveError(error.message || "Session completed, but progress could not be saved.");
    } finally {
      setIsSavingSession(false);
      setIsSessionComplete(true);
    }
  };

  const completeOrLoadNext = async () => {
    if (questionNumber >= TOTAL_QUESTIONS) {
      await saveCompletedSession();
      return;
    }

    if (questionsUsedToday >= FREE_DAILY_QUESTION_LIMIT) {
      showDailyLimitAlert();
      return;
    }

    setQuestionNumber((current) => current + 1);
    loadQuestion();
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setErrorMessage("Please type an answer before submitting.");
      return;
    }

    try {
      setIsEvaluating(true);
      setErrorMessage("");

      const currentQuestionsUsed = await getQuestionsUsedTodaySafely();
      setQuestionsUsedToday(currentQuestionsUsed);

      if (currentQuestionsUsed >= FREE_DAILY_QUESTION_LIMIT) {
        showDailyLimitAlert();
        return;
      }

      const result = await evaluateAnswer(question, answer.trim());
      const parsedScore = Number(result.score);

      console.log("Raw feedback score:", result.score);
      console.log("Parsed question score:", parsedScore);

      if (!Number.isFinite(parsedScore)) {
        throw new Error("AI returned an invalid score. Please submit the answer again.");
      }

      setFeedback(result);
      recordQuestionScore(parsedScore);

      const nextQuestionsUsed = await incrementQuestionsUsedTodaySafely();

      if (nextQuestionsUsed !== null) {
        setQuestionsUsedToday(nextQuestionsUsed);
      } else {
        setQuestionsUsedToday((current) => current + 1);
      }
    } catch (error) {
      setErrorMessage(error.message || "Could not evaluate your answer. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const skipQuestion = () => {
    recordQuestionScore(0);
    completeOrLoadNext();
  };

  const backToHome = () => {
    navigation.navigate("MainTabs", {
      screen: "Home",
      params: { sessionCompleted: true }
    });
  };

  if (isSessionComplete) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        contentContainerStyle={[styles.content, styles.summaryContent]}
      >
        <View style={styles.summaryCard}>
          <Text selectable style={styles.summaryTitle}>
            Session Complete! 🎉
          </Text>
          <Text selectable style={styles.summarySubtitle}>
            You completed {TOTAL_QUESTIONS} interview questions for {jobRole || "your role"}.
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
            <Text selectable style={styles.errorText}>
              {sessionSaveError}
            </Text>
          ) : null}
          <Pressable
            onPress={backToHome}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onTouchStart={Keyboard.dismiss}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <View style={styles.categoryPill}>
            <Text selectable style={styles.categoryText}>
              {categoryName}
            </Text>
          </View>
          <Text selectable style={styles.counterText}>
            Question {questionNumber}/{TOTAL_QUESTIONS}
          </Text>
        </View>

        <View style={styles.questionCard}>
          <Text selectable style={styles.questionLabel}>
            Interview Question
          </Text>
          {isCheckingUsage ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={COLORS.accent} size="large" />
              <Text selectable style={styles.loadingText}>
                Checking your free questions...
              </Text>
            </View>
          ) : isQuestionLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={COLORS.accent} size="large" />
              <Text selectable style={styles.loadingText}>
                Generating your question...
              </Text>
            </View>
          ) : (
            <Text selectable style={styles.questionText}>
              {question || "No question loaded yet."}
            </Text>
          )}
        </View>

        <View style={[styles.timerCard, { borderColor: timerColor }]}>
          <Text selectable style={[styles.timerText, { color: timerColor }]}>
            {secondsLeft}s
          </Text>
          <Text selectable style={styles.timerLabel}>
            Time remaining
          </Text>
        </View>

        <View style={styles.answerSection}>
          <Text selectable style={styles.sectionTitle}>
            Your Answer
          </Text>
          <TextInput
            editable={!isCheckingUsage && !isQuestionLoading && !isEvaluating && !feedback}
            multiline
            onChangeText={setAnswer}
            placeholder="Type your answer here..."
            placeholderTextColor={COLORS.muted}
            style={styles.answerInput}
            textAlignVertical="top"
            value={answer}
          />
        </View>

        {errorMessage ? (
          <Text selectable style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        {!feedback ? (
          <View style={styles.buttonRow}>
            <Pressable
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
            </Pressable>

            <Pressable
              disabled={isCheckingUsage || isQuestionLoading || isEvaluating || isSavingSession || !question}
              onPress={skipQuestion}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
                (isCheckingUsage || isQuestionLoading || isEvaluating || isSavingSession || !question) &&
                  styles.disabledButton
              ]}
            >
              <Text style={styles.secondaryButtonText}>Skip Question</Text>
            </Pressable>
          </View>
        ) : null}

        {feedback ? (
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Text selectable style={styles.feedbackTitle}>
                Feedback
              </Text>
              <Text selectable style={styles.scoreText}>
                {feedback.score}/10
              </Text>
            </View>

            <View style={styles.feedbackSection}>
              <Text selectable style={styles.feedbackSectionTitle}>
                Strengths
              </Text>
              {(feedback.strengths || []).map((strength) => (
                <Text key={strength} selectable style={styles.strengthText}>
                  • {strength}
                </Text>
              ))}
            </View>

            <View style={styles.feedbackSection}>
              <Text selectable style={styles.feedbackSectionTitle}>
                Improvements
              </Text>
              {(feedback.improvements || []).map((improvement) => (
                <Text key={improvement} selectable style={styles.improvementText}>
                  • {improvement}
                </Text>
              ))}
            </View>

            <Pressable
              onPress={() => setShowIdealAnswer((current) => !current)}
              style={({ pressed }) => [styles.collapsibleButton, pressed && styles.pressed]}
            >
              <Text style={styles.collapsibleButtonText}>
                {showIdealAnswer ? "Hide Ideal Answer" : "Show Ideal Answer"}
              </Text>
            </Pressable>

            {showIdealAnswer ? (
              <Text selectable style={styles.idealAnswerText}>
                {feedback.idealAnswer}
              </Text>
            ) : null}

            <Pressable
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
                  {questionNumber >= TOTAL_QUESTIONS ? "View Summary" : "Next Question"}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  answerInput: {
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 150,
    padding: 16
  },
  answerSection: {
    gap: 12
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
    borderColor: "#2A2A2A",
    borderRadius: 8,
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
    gap: 22,
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
  feedbackCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.accent,
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 18
  },
  feedbackHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  feedbackSection: {
    gap: 8
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
  idealAnswerText: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23
  },
  improvementText: {
    color: COLORS.yellow,
    fontSize: 15,
    lineHeight: 22
  },
  keyboardView: {
    flex: 1
  },
  loadingBox: {
    alignItems: "center",
    gap: 14
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "800"
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
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 18
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900"
  },
  questionCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    justifyContent: "center",
    minHeight: 210,
    padding: 24
  },
  questionLabel: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  questionText: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 34,
    textAlign: "center"
  },
  scoreText: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: "900"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
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
  strengthText: {
    color: COLORS.green,
    fontSize: 15,
    lineHeight: 22
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    padding: 22
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
    fontSize: 13,
    fontWeight: "800"
  },
  timerText: {
    fontSize: 34,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 42
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 8
  }
});
