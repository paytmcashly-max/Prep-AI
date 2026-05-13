import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect } from "@react-navigation/native";

import FreeLimitCard from "../components/FreeLimitCard";
import HapticPressable from "../components/HapticPressable";
import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppText from "../components/ui/AppText";
import ExpandableSection from "../components/ui/ExpandableSection";
import AppIcon from "../components/ui/AppIcon";
import JobRolePicker from "../components/ui/JobRolePicker";
import LoadingState from "../components/ui/LoadingState";
import MessageCard from "../components/ui/MessageCard";
import ScoreRing from "../components/ui/ScoreRing";
import ScreenHero from "../components/ui/ScreenHero";
import UploadCard from "../components/ui/UploadCard";
import { trackEvent } from "../services/analyticsService";
import { ApiClientError, getLatestResumeAnalysis, getUsageStatus } from "../services/apiClient";
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
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.keywordBadge,
        { backgroundColor: colors.dangerSoft, borderColor: colors.danger }
      ]}
    >
      <AppText color={colors.danger} variant="caption">
        {label}
      </AppText>
    </View>
  );
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

function PreviousResumeCheckCard({ analysis, isOpen, onPress }) {
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
        <AppText tone="secondary" variant="caption">
          Latest resume check
        </AppText>
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

export default function ResumeScreen({ navigation }) {
  const { colors } = useAppTheme();
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
  const [overviewError, setOverviewError] = useState("");
  const [usageStatus, setUsageStatus] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isResumeLimitReached, setIsResumeLimitReached] = useState(false);
  const [resumeResetCountdown, setResumeResetCountdown] = useState(() =>
    formatCountdown(getMsUntilNextResumeReset())
  );
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [showPreviousAnalysisDetails, setShowPreviousAnalysisDetails] = useState(true);
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
  const shouldShowAnalysisDetails = Boolean(
    analysis && (!shouldShowResumeLimit || showPreviousAnalysisDetails)
  );
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
          setAnalysis(parsedAnalysis);
          setShowPreviousAnalysisDetails(false);
          return parsedAnalysis;
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

  const loadResumeOverview = useCallback(async () => {
    try {
      setIsLoadingOverview(true);
      setOverviewError("");

      const [nextUsageStatus, latestAnalysis] = await Promise.all([
        getUsageStatus(),
        getLatestResumeAnalysis()
      ]);

      setUsageStatus(nextUsageStatus);
      setIsResumeLimitReached(
        !useSubscriptionStore.getState().isPremium &&
          Number(nextUsageStatus?.resume?.remaining || 0) <= 0
      );

      if (latestAnalysis) {
        setAnalysis(latestAnalysis);
        setShowPreviousAnalysisDetails(false);
        await persistLastAnalysis(latestAnalysis);
      } else {
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
  }, [loadLastAnalysis, persistLastAnalysis]);

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
        jobRole
      };

      setAnalysis(nextAnalysis);
      setShowPreviousAnalysisDetails(true);
      await persistLastAnalysis(nextAnalysis);
      loadResumeOverview().catch(() => null);
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
    setAnalysis(null);
    setShowPreviousAnalysisDetails(false);
    setErrorMessage("");
    setIsResumeLimitReached(false);
    setIsAnalyzing(false);
    setShowPasteFallback(false);
  };

  if (isLoadingOverview) {
    return (
      <KeyboardAwareScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
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
      contentContainerStyle={styles.content}
    >
      {!shouldShowResumeLimit ? (
        <ScreenHero
          badge="Resume intelligence"
          badgeIcon="document"
          logo
          title="Resume Analyzer"
          subtitle="Upload a text-based PDF under 5MB for ATS feedback, missing keywords, and cleaner resume lines."
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
            <View style={styles.fileBox}>
              <AppText tone="secondary" variant="caption">
                PDF selected
              </AppText>
              <AppText numberOfLines={2} variant="bodyStrong">
                {selectedFile.name}
              </AppText>
            </View>
          ) : (
            <MessageCard
              title="PDF-first analysis"
              message="Choose a text-based PDF under 5MB. If extraction fails, a manual paste fallback will appear here."
            />
          )}

          {showPasteFallback ? (
            <View style={styles.fallbackCard}>
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

          <AppButton
            disabled={!canAnalyzeResume}
            loading={isAnalyzing}
            onPress={analyzeSelectedResume}
          >
            {selectedFile
              ? "Analyze PDF"
              : showPasteFallback
                ? "Analyze Pasted Text"
                : "Choose PDF to Analyze"}
          </AppButton>
        </AppCard>
      )}

      {analysis ? (
        <PreviousResumeCheckCard
          analysis={analysis}
          isOpen={showPreviousAnalysisDetails}
          onPress={() => setShowPreviousAnalysisDetails((current) => !current)}
        />
      ) : null}

      {shouldShowAnalysisDetails ? (
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
                <View key={issue} style={styles.issueRow}>
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
              <SectionFeedbackCard
                key={key}
                title={label}
                value={analysis.sectionFeedback?.[key]}
              />
            ))}
          </View>

          {!shouldShowResumeLimit ? (
            <AppButton onPress={resetScreen} tone="secondary">
              Analyze Another
            </AppButton>
          ) : null}
        </AppCard>
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
    gap: 16,
    padding: 16,
    paddingBottom: 108
  },
  fallbackCard: {
    backgroundColor: "rgba(250, 204, 21, 0.08)",
    borderColor: "rgba(250, 204, 21, 0.3)",
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
    gap: 5,
    padding: 14
  },
  flexText: {
    flex: 1
  },
  issueRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  keywordBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9
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
    gap: 12,
    justifyContent: "space-between",
    padding: 14
  },
  previousCheckCopy: {
    flex: 1,
    gap: 5
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
    minHeight: 64,
    width: 64
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
    gap: 10,
    padding: 12
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
    gap: 13,
    padding: 14
  },
  scoreHero: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  scoreHeroCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0
  },
  inputCard: {
    gap: 14
  }
});
