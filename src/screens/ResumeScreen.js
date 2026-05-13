import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FreeLimitCard from "../components/FreeLimitCard";
import HapticPressable from "../components/HapticPressable";
import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppText from "../components/ui/AppText";
import ExpandableSection from "../components/ui/ExpandableSection";
import AppIcon from "../components/ui/AppIcon";
import Badge from "../components/ui/Badge";
import JobRolePicker from "../components/ui/JobRolePicker";
import LoadingState from "../components/ui/LoadingState";
import MessageCard from "../components/ui/MessageCard";
import ScoreRing from "../components/ui/ScoreRing";
import ScreenHero from "../components/ui/ScreenHero";
import UploadCard from "../components/ui/UploadCard";
import { trackEvent } from "../services/analyticsService";
import { ApiClientError, getResumeAnalysisHistory, getUsageStatus } from "../services/apiClient";
import { auth } from "../services/firebaseConfig";
import { analyzeResume, analyzeResumePdf } from "../services/aiService";
import { formatCountdown, getMsUntilNextResumeReset } from "../services/quotaService";
import { validateResumePdfAsset } from "../services/resumeService";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useUserStore } from "../store/userStore";
import { useAppTheme } from "../theme";

const SECTION_LABELS = {
  summary: "Summary",
  experience: "Experience",
  skills: "Skills",
  education: "Education"
};

const RESUME_LIMIT_BENEFITS = [
  "Previous resume check stays saved",
  "Premium unlocks more resume scans",
  "ATS feedback and suggested lines stay visible"
];

const getLastResumeAnalysisStorageKey = () => {
  const uid = auth.currentUser?.uid || "anonymous";

  return `last_resume_analysis:${uid}`;
};

const getAtsToneLabel = (score) => {
  if (score > 70) {
    return "Strong match";
  }

  if (score >= 50) {
    return "Good start";
  }

  return "Needs work";
};

const getCountdownUntil = (resetAt) => {
  const resetTime = new Date(resetAt || 0).getTime();

  if (!Number.isFinite(resetTime)) {
    return formatCountdown(getMsUntilNextResumeReset());
  }

  return formatCountdown(resetTime - Date.now());
};

const isPdfExtractionError = (error) => {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("extract") ||
    message.includes("scanned") ||
    message.includes("image-only") ||
    message.includes("text-based pdf") ||
    message.includes("too short") ||
    message.includes("could not read")
  );
};

function KeywordBadge({ label }) {
  return <Badge label={label} style={styles.keywordBadge} tone="danger" />;
}

function SectionFeedbackCard({ title, value }) {
  return (
    <ExpandableSection subtitle="Section-level guidance" title={title}>
      <AppText tone="muted" variant="body">
        {value || "No feedback available yet."}
      </AppText>
    </ExpandableSection>
  );
}

function PreviousResumeCheckCard({ analysis, isOpen, label, onPress }) {
  const { colors } = useAppTheme();

  if (!analysis) {
    return null;
  }

  const createdDate = analysis.createdAt
    ? new Date(analysis.createdAt).toLocaleDateString()
    : "Recent check";
  const missingCount = (analysis.missingKeywords || []).length;
  const suggestionCount = (analysis.rewriteSuggestions || []).length;

  return (
    <HapticPressable
      accessibilityLabel={
        isOpen ? "Hide previous resume check details" : "Show previous resume check details"
      }
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.previousCheckCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed
      ]}
    >
      <View
        style={[
          styles.previousScoreBlock,
          { backgroundColor: colors.primarySoft, borderColor: colors.border }
        ]}
      >
        <AppText color={colors.primary} variant="statNumber">
          {analysis.atsScore}
        </AppText>
        <AppText tone="muted" variant="caption">
          ATS
        </AppText>
      </View>
      <View style={styles.previousCheckCopy}>
        <Badge icon="calendar" label={label} tone="default" />
        <AppText variant="cardTitle">{analysis.jobRole || "Target role"}</AppText>
        <View style={styles.previousStatsRow}>
          <View style={styles.previousStatItem}>
            <AppIcon color={colors.muted} name="calendar" size={14} />
            <AppText tone="muted" variant="bodyMuted">
              {createdDate}
            </AppText>
          </View>
          <View style={styles.previousStatItem}>
            <AppIcon color={colors.danger} name="target" size={14} />
            <AppText tone="muted" variant="bodyMuted">
              {missingCount} missing
            </AppText>
          </View>
          <View style={styles.previousStatItem}>
            <AppIcon color={colors.secondary} name="edit" size={14} />
            <AppText tone="muted" variant="bodyMuted">
              {suggestionCount} suggestions
            </AppText>
          </View>
        </View>
      </View>
      <View style={[styles.previousCheckAction, { backgroundColor: colors.cardAlt }]}>
        <AppIcon color={colors.secondary} name={isOpen ? "up" : "down"} size={18} />
      </View>
    </HapticPressable>
  );
}

function ResumeAnalysisDetails({ analysis, atsColor, atsToneLabel, onReset }) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.resultsCard}>
      <View style={styles.scoreHero}>
        <ScoreRing label="ATS" score={analysis.atsScore} size={92} />
        <View style={styles.scoreHeroCopy}>
          <AppText variant="sectionTitle">Resume readiness</AppText>
          <AppText color={atsColor} variant="bodyStrong">
            {atsToneLabel}
          </AppText>
          <AppText tone="muted" variant="bodyMuted">
            Score is based on role fit, keywords, clarity, and section strength.
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.resultSection,
          { backgroundColor: colors.cardAlt, borderColor: colors.border }
        ]}
      >
        <AppText variant="sectionTitle">Missing Keywords</AppText>
        {(analysis.missingKeywords || []).length ? (
          <View style={styles.badgeRow}>
            {(analysis.missingKeywords || []).map((keyword) => (
              <KeywordBadge key={keyword} label={keyword} />
            ))}
          </View>
        ) : (
          <View style={styles.cleanStateRow}>
            <AppIcon color={colors.success} name="success" size={17} />
            <AppText style={styles.flexText} tone="muted" variant="bodyMuted">
              No major missing keywords were returned.
            </AppText>
          </View>
        )}
      </View>

      <View
        style={[
          styles.resultSection,
          { backgroundColor: colors.cardAlt, borderColor: colors.border }
        ]}
      >
        <AppText variant="sectionTitle">Grammar Issues</AppText>
        {(analysis.grammarIssues || []).length ? (
          (analysis.grammarIssues || []).map((issue) => (
            <View
              key={issue}
              style={[
                styles.issueRow,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <AppIcon color={colors.warning} name="warning" size={16} />
              <AppText style={styles.flexText} variant="bodyMuted">
                {issue}
              </AppText>
            </View>
          ))
        ) : (
          <View style={styles.cleanStateRow}>
            <AppIcon color={colors.success} name="success" size={17} />
            <AppText style={styles.flexText} tone="muted" variant="bodyMuted">
              No obvious grammar issues found.
            </AppText>
          </View>
        )}
      </View>

      <View
        style={[
          styles.resultSection,
          { backgroundColor: colors.cardAlt, borderColor: colors.border }
        ]}
      >
        <View style={styles.resultSectionHeader}>
          <AppText variant="sectionTitle">Suggested Lines to Add</AppText>
          <AppText tone="muted" variant="bodyMuted">
            Copy the strongest lines into the right resume section.
          </AppText>
        </View>
        {(analysis.rewriteSuggestions || []).length ? (
          (analysis.rewriteSuggestions || []).map((suggestion, index) => (
            <View
              key={`${suggestion}-${index}`}
              style={[
                styles.rewriteCard,
                { backgroundColor: colors.secondarySoft, borderColor: colors.border }
              ]}
            >
              <AppText color={colors.secondary} variant="caption">
                {String(index + 1).padStart(2, "0")}
              </AppText>
              <AppText style={styles.flexText} variant="body">
                {suggestion}
              </AppText>
            </View>
          ))
        ) : (
          <AppText tone="muted" variant="bodyMuted">
            No suggested lines were returned for this resume.
          </AppText>
        )}
      </View>

      <View
        style={[
          styles.resultSection,
          { backgroundColor: colors.cardAlt, borderColor: colors.border }
        ]}
      >
        <AppText variant="sectionTitle">Section Feedback</AppText>
        {Object.entries(SECTION_LABELS).map(([key, label]) => (
          <SectionFeedbackCard key={key} title={label} value={analysis.sectionFeedback?.[key]} />
        ))}
      </View>

      <AppButton onPress={onReset} tone="secondary">
        Analyze Another
      </AppButton>
    </AppCard>
  );
}

export default function ResumeScreen({ navigation }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const savedJobRole = useUserStore((state) => state.profile.jobRole);
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const refreshSubscriptionStatus = useSubscriptionStore(
    (state) => state.refreshSubscriptionStatus
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jobRole, setJobRole] = useState(savedJobRole || "Full Stack Developer");
  const [isPickingPdf, setIsPickingPdf] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isRefreshingOverview, setIsRefreshingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [usageStatus, setUsageStatus] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isResumeLimitReached, setIsResumeLimitReached] = useState(false);
  const [resumeResetCountdown, setResumeResetCountdown] = useState(() =>
    formatCountdown(getMsUntilNextResumeReset())
  );
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [showPreviousAnalysisDetails, setShowPreviousAnalysisDetails] = useState(true);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const analysisRequestInFlightRef = useRef(false);
  const resumeQuota = usageStatus?.resume;
  const hasServerPremiumAccess = usageStatus?.isPremium === true || resumeQuota?.isPremium === true;
  const hasPremiumAccess = hasServerPremiumAccess;
  const isLocalPremiumPendingServerSync =
    isPremium && !hasServerPremiumAccess && resumeQuota && Number(resumeQuota.remaining || 0) <= 0;
  const isServerResumeLimitReached =
    !isPremium && !hasPremiumAccess && resumeQuota && Number(resumeQuota.remaining || 0) <= 0;
  const isBlockedByResumeLimit =
    (isResumeLimitReached || isServerResumeLimitReached) && !hasPremiumAccess;
  const shouldShowResumeLimit = !isLoadingOverview && isBlockedByResumeLimit;
  const hasResumeInput = Boolean(selectedFile || (showPasteFallback && resumeText.trim()));
  const canAnalyzeResume = Boolean(jobRole && hasResumeInput && !isAnalyzing && !isLoadingOverview);
  const analysis = useMemo(() => {
    if (!analysisHistory.length) {
      return null;
    }

    return (
      analysisHistory.find((item) => item.id === selectedAnalysisId) || analysisHistory[0] || null
    );
  }, [analysisHistory, selectedAnalysisId]);
  const atsColor = useMemo(() => {
    const score = Number(analysis?.atsScore || 0);

    if (score > 70) {
      return colors.success;
    }

    if (score >= 50) {
      return colors.warning;
    }

    return colors.danger;
  }, [analysis?.atsScore, colors.danger, colors.success, colors.warning]);
  const atsToneLabel = useMemo(
    () => getAtsToneLabel(Number(analysis?.atsScore || 0)),
    [analysis?.atsScore]
  );

  const loadLastAnalysis = useCallback(async () => {
    try {
      const savedAnalysis = await AsyncStorage.getItem(getLastResumeAnalysisStorageKey());

      if (savedAnalysis) {
        const parsedAnalysis = JSON.parse(savedAnalysis);

        if (parsedAnalysis && typeof parsedAnalysis === "object") {
          const cachedAnalysis = {
            id: parsedAnalysis.id || "cached-latest",
            ...parsedAnalysis
          };

          setAnalysisHistory([cachedAnalysis]);
          setSelectedAnalysisId(cachedAnalysis.id);
          setShowPreviousAnalysisDetails(false);
          return cachedAnalysis;
        }
      }
    } catch {
      return null;
    }

    return null;
  }, []);

  const persistLastAnalysis = useCallback(async (nextAnalysis) => {
    try {
      await AsyncStorage.setItem(getLastResumeAnalysisStorageKey(), JSON.stringify(nextAnalysis));
    } catch {
      // The resume text itself is never stored here; losing cached analysis is safe.
    }
  }, []);

  const loadResumeOverview = useCallback(
    async ({ collapseDetails = true, silent = false } = {}) => {
      try {
        if (!silent) {
          setIsLoadingOverview(true);
        }
        setOverviewError("");

        const [nextUsageStatus, nextHistory] = await Promise.all([
          getUsageStatus(),
          getResumeAnalysisHistory()
        ]);

        setUsageStatus(nextUsageStatus);
        setIsResumeLimitReached(
          !useSubscriptionStore.getState().isPremium &&
            Number(nextUsageStatus?.resume?.remaining || 0) <= 0
        );

        if (nextHistory?.length) {
          setAnalysisHistory(nextHistory);
          setSelectedAnalysisId((current) => {
            if (!collapseDetails && current && nextHistory.some((item) => item.id === current)) {
              return current;
            }

            return nextHistory[0].id;
          });
          if (collapseDetails) {
            setShowPreviousAnalysisDetails(false);
          }
          await persistLastAnalysis(nextHistory[0]);
        } else {
          setAnalysisHistory([]);
          setSelectedAnalysisId(null);
          await loadLastAnalysis();
        }
      } catch (error) {
        setOverviewError(error.message || "Could not load resume usage status.");
        setUsageStatus(null);
        setIsResumeLimitReached(false);
        await loadLastAnalysis();
      } finally {
        setIsLoadingOverview(false);
      }
    },
    [loadLastAnalysis, persistLastAnalysis]
  );

  const refreshResumeOverview = useCallback(async () => {
    try {
      setIsRefreshingOverview(true);
      await refreshSubscriptionStatus().catch(() => null);
      await loadResumeOverview({ collapseDetails: false, silent: true });
    } finally {
      setIsRefreshingOverview(false);
    }
  }, [loadResumeOverview, refreshSubscriptionStatus]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      loadResumeOverview();

      refreshSubscriptionStatus()
        .then(() => {
          if (isActive) {
            loadResumeOverview();
          }
        })
        .catch(() => null);

      return () => {
        isActive = false;
      };
    }, [loadResumeOverview, refreshSubscriptionStatus])
  );

  useEffect(() => {
    if (isPremium) {
      setIsResumeLimitReached(false);
      setResumeResetCountdown("--:--:--");
    }
  }, [isPremium]);

  useEffect(() => {
    if (!isBlockedByResumeLimit) {
      return undefined;
    }

    const updateCountdown = () => {
      const resetTime = resumeQuota?.resetAt ? new Date(resumeQuota.resetAt).getTime() : NaN;

      if (Number.isFinite(resetTime) && resetTime <= Date.now()) {
        setResumeResetCountdown("00:00:00");
        setIsResumeLimitReached(false);
        setUsageStatus((current) =>
          current
            ? {
                ...current,
                resume: {
                  ...current.resume,
                  remaining: current.resume?.limit || 1,
                  used: 0
                }
              }
            : current
        );
        loadResumeOverview();
        return;
      }

      setResumeResetCountdown(getCountdownUntil(resumeQuota?.resetAt));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [isBlockedByResumeLimit, loadResumeOverview, resumeQuota?.resetAt]);

  const pickPdf = async () => {
    try {
      setIsPickingPdf(true);
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: "application/pdf"
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      validateResumePdfAsset(asset);
      setSelectedFile(asset);
      setErrorMessage("");
      setResumeText("");
      setShowPasteFallback(false);
      if (isPremium) {
        setIsResumeLimitReached(false);
      }
    } catch (error) {
      setSelectedFile(null);
      setErrorMessage(error.message || "Could not pick this PDF.");
    } finally {
      setIsPickingPdf(false);
    }
  };

  const analyzeSelectedResume = async () => {
    if (analysisRequestInFlightRef.current || isAnalyzing) {
      return;
    }

    if (isBlockedByResumeLimit) {
      return;
    }

    if (!selectedFile && !showPasteFallback) {
      Alert.alert("Upload resume", "Please upload a text-based PDF resume first.");
      return;
    }

    if (!selectedFile && !resumeText.trim()) {
      Alert.alert("Paste resume text", "Please paste your resume text before analyzing.");
      return;
    }

    if (!jobRole) {
      Alert.alert("Select role", "Please choose a target job role.");
      return;
    }

    const trimmedText = resumeText.trim();

    if (!selectedFile && trimmedText.length < 100) {
      setErrorMessage("Resume text is too short. Please paste at least 100 characters.");
      return;
    }

    try {
      analysisRequestInFlightRef.current = true;
      setIsAnalyzing(true);
      setErrorMessage("");
      setIsResumeLimitReached(false);
      trackEvent("resume_analysis_started", {
        inputType: selectedFile ? "pdf" : "text",
        jobRole
      });

      if (selectedFile) {
        validateResumePdfAsset(selectedFile);
      }

      const result = selectedFile
        ? await analyzeResumePdf(selectedFile, jobRole)
        : await analyzeResume(trimmedText, jobRole);

      const nextAnalysis = {
        ...result,
        createdAt: new Date().toISOString(),
        id: `local-${Date.now()}`,
        jobRole
      };

      setAnalysisHistory((current) => {
        const keepCount = hasPremiumAccess || isPremium ? 5 : 1;
        const withoutDuplicate = current.filter((item) => item.id !== nextAnalysis.id);

        return [nextAnalysis, ...withoutDuplicate].slice(0, keepCount);
      });
      setSelectedAnalysisId(nextAnalysis.id);
      setShowPreviousAnalysisDetails(true);
      await persistLastAnalysis(nextAnalysis);
      loadResumeOverview({ collapseDetails: false }).catch(() => null);
      setIsResumeLimitReached(false);
      trackEvent("resume_analysis_completed", {
        atsScore: Number(result.atsScore || 0),
        inputType: selectedFile ? "pdf" : "text",
        jobRole
      });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 429) {
        setIsResumeLimitReached(true);
        setShowPreviousAnalysisDetails(false);
        setErrorMessage("");
        if (!analysis) {
          await loadResumeOverview();
        }
      } else if (selectedFile && isPdfExtractionError(error)) {
        setShowPasteFallback(true);
        setSelectedFile(null);
        setErrorMessage(
          "We could not read enough text from this PDF. Paste your resume text manually instead."
        );
      } else {
        setErrorMessage(error.message || "Could not analyze this resume. Please try again.");
      }
    } finally {
      analysisRequestInFlightRef.current = false;
      setIsAnalyzing(false);
    }
  };

  const resetScreen = () => {
    setSelectedFile(null);
    setResumeText("");
    setErrorMessage("");
    setIsResumeLimitReached(false);
    setIsAnalyzing(false);
    setShowPasteFallback(false);
  };

  if (isLoadingOverview) {
    return (
      <KeyboardAwareScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom + 82, 92),
            paddingTop: Math.max(insets.top + 2, 10)
          }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingOverview}
            onRefresh={refreshResumeOverview}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
      >
        <LoadingState
          message="Checking your scan availability and latest resume result."
          title="Preparing resume analyzer"
        />
      </KeyboardAwareScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: Math.max(insets.bottom + 82, 92),
          paddingTop: Math.max(insets.top + 2, 10)
        }
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshingOverview}
          onRefresh={refreshResumeOverview}
          tintColor={colors.secondary}
          colors={[colors.secondary]}
        />
      }
    >
      {!shouldShowResumeLimit ? (
        <ScreenHero
          badge="Resume intelligence"
          badgeIcon="document"
          logo
          title="Resume Review"
          subtitle="Get ATS feedback, keyword gaps, and sharper resume lines for your target role."
        />
      ) : null}

      {overviewError ? (
        <View style={styles.retryCard}>
          <MessageCard title="Could not load resume status" message={overviewError} tone="error" />
          <AppButton onPress={loadResumeOverview} tone="secondary">
            Retry
          </AppButton>
        </View>
      ) : null}

      {isLoadingOverview ? null : shouldShowResumeLimit ? (
        <FreeLimitCard
          benefits={RESUME_LIMIT_BENEFITS}
          countdownLabel="Next free scan in"
          message={
            analysis
              ? "Your previous resume check is saved below. Upgrade for more scans or wait for the next free scan."
              : "Upgrade for more scans or wait for the next free scan."
          }
          onUpgrade={() => navigation.navigate("Paywall")}
          resetCountdown={resumeResetCountdown}
          style={styles.resumeLimitCard}
          title="Free resume scan limit reached"
        />
      ) : isLocalPremiumPendingServerSync ? (
        <FreeLimitCard
          benefits={[]}
          message="Premium is active on this device, but server access has not synced yet. Refresh your plan and try again."
          onBack={loadResumeOverview}
          onUpgrade={() => refreshSubscriptionStatus().finally(loadResumeOverview)}
          primaryLabel="Refresh Plan"
          secondaryLabel="Retry"
          style={styles.resumeLimitCard}
          title="Premium sync pending"
        />
      ) : (
        <AppCard style={styles.inputCard}>
          <UploadCard
            disabled={isPickingPdf}
            helper="Text-based PDF only. Max file size 5MB."
            onPress={pickPdf}
            title={
              isPickingPdf ? "Opening file picker..." : selectedFile ? "Replace PDF" : "Choose PDF"
            }
          />

          {selectedFile ? (
            <View
              style={[
                styles.fileBox,
                { backgroundColor: colors.cardAlt, borderColor: colors.border }
              ]}
            >
              <AppText tone="secondary" variant="caption">
                PDF selected
              </AppText>
              <AppText numberOfLines={2} variant="bodyStrong">
                {selectedFile.name}
              </AppText>
            </View>
          ) : null}

          {showPasteFallback ? (
            <View
              style={[
                styles.fallbackCard,
                { backgroundColor: colors.warningSoft, borderColor: colors.warning }
              ]}
            >
              <View style={styles.fallbackHeader}>
                <AppIcon color={colors.warning} name="warning" size={20} />
                <View style={styles.fallbackCopy}>
                  <AppText variant="cardTitle">We could not read this PDF</AppText>
                  <AppText tone="muted" variant="bodyMuted">
                    Paste your resume text below so IntervueAI can still analyze the content.
                  </AppText>
                </View>
              </View>
              <AppText variant="bodyStrong">Resume text</AppText>
              <TextInput
                multiline
                numberOfLines={8}
                onChangeText={setResumeText}
                placeholder="Paste your resume content..."
                placeholderTextColor={colors.muted}
                style={[
                  styles.resumeInput,
                  {
                    backgroundColor: colors.cardAlt,
                    borderColor: colors.border,
                    color: colors.text
                  }
                ]}
                textAlignVertical="top"
                value={resumeText}
              />
            </View>
          ) : null}

          <JobRolePicker selectedValue={jobRole} onSelect={setJobRole} />

          {errorMessage ? (
            <MessageCard title="Resume check stopped" message={errorMessage} tone="error" />
          ) : null}

          <AppButton disabled={!canAnalyzeResume} onPress={analyzeSelectedResume}>
            {selectedFile
              ? "Analyze PDF"
              : showPasteFallback
                ? "Analyze Pasted Text"
                : "Choose PDF to Analyze"}
          </AppButton>
        </AppCard>
      )}

      {isAnalyzing ? (
        <LoadingState
          message="Reviewing ATS fit, keywords, grammar, and section quality for your selected role."
          title="Analyzing your resume"
        />
      ) : null}

      {analysisHistory.length ? (
        <View style={styles.historyList}>
          {analysisHistory.map((item, index) => {
            const isSelected = analysis?.id === item.id;
            const isOpen = isSelected && showPreviousAnalysisDetails;

            return (
              <View key={item.id} style={styles.historyItem}>
                <PreviousResumeCheckCard
                  analysis={item}
                  isOpen={isOpen}
                  label={index === 0 ? "Latest resume check" : "Saved resume check"}
                  onPress={() => {
                    if (isSelected) {
                      setShowPreviousAnalysisDetails((current) => !current);
                      return;
                    }

                    setSelectedAnalysisId(item.id);
                    setShowPreviousAnalysisDetails(true);
                  }}
                />
                {isOpen ? (
                  <ResumeAnalysisDetails
                    analysis={item}
                    atsColor={atsColor}
                    atsToneLabel={atsToneLabel}
                    onReset={resetScreen}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  cleanStateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  container: {
    flex: 1
  },
  content: {
    gap: 14,
    paddingHorizontal: 16
  },
  fallbackCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  fallbackCopy: {
    flex: 1,
    gap: 3
  },
  fallbackHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10
  },
  fileBox: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 12
  },
  flexText: {
    flex: 1
  },
  historyList: {
    gap: 8
  },
  historyItem: {
    gap: 8
  },
  issueRow: {
    alignItems: "flex-start",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10
  },
  keywordBadge: {
    paddingHorizontal: 13
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  previousCheckCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 12
  },
  previousCheckCopy: {
    flex: 1,
    gap: 4
  },
  previousCheckAction: {
    alignItems: "center",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  previousScoreBlock: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    gap: 1,
    justifyContent: "center",
    minHeight: 58,
    width: 58
  },
  previousStatItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  previousStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  resultSection: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  resultSectionHeader: {
    gap: 5
  },
  retryCard: {
    gap: 12
  },
  rewriteCard: {
    alignItems: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10
  },
  resumeInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 132,
    padding: 12
  },
  resumeLimitCard: {
    alignSelf: "center",
    gap: 11,
    padding: 14,
    width: "96%"
  },
  resultsCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 11,
    padding: 12
  },
  scoreHero: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  scoreHeroCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  inputCard: {
    gap: 12
  }
});
