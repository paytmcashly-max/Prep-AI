import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect } from "@react-navigation/native";

import FreeLimitCard from "../components/FreeLimitCard";
import HapticPressable from "../components/HapticPressable";
import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import AppIcon from "../components/ui/AppIcon";
import { trackEvent } from "../services/analyticsService";
import { ApiClientError, getLatestResumeAnalysis, getUsageStatus } from "../services/apiClient";
import { auth } from "../services/firebaseConfig";
import { analyzeResume, analyzeResumePdf } from "../services/aiService";
import { formatCountdown, getMsUntilNextResumeReset } from "../services/quotaService";
import { validateResumePdfAsset } from "../services/resumeService";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useUserStore } from "../store/userStore";
import { DARK_COLORS } from "../theme";

const JOB_ROLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Android Developer",
  "Data Scientist",
  "MBA/Management"
];

const COLORS = DARK_COLORS;

const SECTION_LABELS = {
  summary: "Summary",
  experience: "Experience",
  skills: "Skills",
  education: "Education"
};

const RESUME_LIMIT_BENEFITS = [
  "Previous resume check stays saved",
  "Premium unlocks more resume scans",
  "Suggested lines and ATS feedback remain visible"
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

function JobRolePicker({ selectedValue, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.field}>
      <Text selectable style={styles.label}>
        Job Role
      </Text>
      <HapticPressable
        onPress={() => setIsOpen((current) => !current)}
        style={({ pressed }) => [styles.selectButton, pressed && styles.pressed]}
      >
        <Text style={[styles.selectText, !selectedValue && styles.placeholderText]}>
          {selectedValue || "Select target role"}
        </Text>
        <AppIcon color={COLORS.accent} name={isOpen ? "up" : "down"} size={20} />
      </HapticPressable>

      {isOpen ? (
        <View style={styles.optionsPanel}>
          {JOB_ROLES.map((role) => {
            const selected = selectedValue === role;

            return (
              <HapticPressable
                key={role}
                onPress={() => {
                  onSelect(role);
                  setIsOpen(false);
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  selected && styles.optionRowSelected,
                  pressed && styles.pressed
                ]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {role}
                </Text>
              </HapticPressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function KeywordBadge({ label }) {
  return (
    <View style={styles.keywordBadge}>
      <Text selectable style={styles.keywordBadgeText}>
        {label}
      </Text>
    </View>
  );
}

function SectionFeedbackCard({ title, value }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.feedbackItem}>
      <HapticPressable
        onPress={() => setIsOpen((current) => !current)}
        style={({ pressed }) => [styles.feedbackHeader, pressed && styles.pressed]}
      >
        <Text selectable style={styles.feedbackTitle}>
          {title}
        </Text>
        <Text style={styles.chevron}>{isOpen ? "Hide" : "Show"}</Text>
      </HapticPressable>
      {isOpen ? (
        <Text selectable style={styles.feedbackText}>
          {value || "No feedback available yet."}
        </Text>
      ) : null}
    </View>
  );
}

function MessageCard({ message, title, tone = "default" }) {
  return (
    <View style={[styles.messageCard, tone === "error" && styles.errorMessageCard]}>
      <Text selectable style={styles.messageTitle}>
        {title}
      </Text>
      <Text selectable style={[styles.messageText, tone === "error" && styles.errorText]}>
        {message}
      </Text>
    </View>
  );
}

function PreviousResumeCheckCard({ analysis, isOpen, onPress }) {
  if (!analysis) {
    return null;
  }

  return (
    <HapticPressable
      onPress={onPress}
      style={({ pressed }) => [styles.previousCheckCard, pressed && styles.pressed]}
    >
      <View style={styles.previousCheckCopy}>
        <Text selectable style={styles.previousCheckLabel}>
          Previous resume check
        </Text>
        <Text selectable style={styles.previousCheckTitle}>
          ATS Score {analysis.atsScore}/100
        </Text>
        <Text selectable style={styles.previousCheckMeta}>
          {analysis.jobRole || "Target role"} -{" "}
          {analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : "Recent check"}
        </Text>
        <Text selectable style={styles.previousCheckMeta}>
          {(analysis.missingKeywords || []).length} missing keywords found
        </Text>
        <Text selectable style={styles.previousCheckHint}>
          {isOpen ? "Hide full details" : "Tap to view full details"}
        </Text>
      </View>
      <View style={styles.previousCheckAction}>
        <Text style={styles.chevron}>{isOpen ? "Hide" : "Show"}</Text>
        <AppIcon color={COLORS.accent} name={isOpen ? "up" : "down"} size={18} />
      </View>
    </HapticPressable>
  );
}

export default function ResumeScreen({ navigation }) {
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
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
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
  const shouldShowAnalysisDetails = Boolean(
    analysis && (!isBlockedByResumeLimit || showPreviousAnalysisDetails)
  );
  const atsColor = useMemo(() => {
    const score = Number(analysis?.atsScore || 0);

    if (score > 70) {
      return COLORS.green;
    }

    if (score >= 50) {
      return COLORS.yellow;
    }

    return COLORS.red;
  }, [analysis?.atsScore]);
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
      await loadLastAnalysis();
    } finally {
      setIsLoadingOverview(false);
    }
  }, [loadLastAnalysis, persistLastAnalysis]);

  useFocusEffect(
    useCallback(() => {
      loadResumeOverview();
      if (!useSubscriptionStore.getState().isPremium) {
        refreshSubscriptionStatus().catch(() => null);
      }
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

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!isBlockedByResumeLimit ? (
        <View style={styles.header}>
          <Text selectable style={styles.title}>
            Resume Analyzer
          </Text>
          <Text selectable style={styles.subtitle}>
            Upload a text-based PDF under 5MB. If the PDF cannot be read, we will offer a manual
            paste fallback.
          </Text>
        </View>
      ) : null}

      {isLoadingOverview ? (
        <MessageCard
          title="Checking resume quota"
          message="Loading your latest resume analysis and free scan status."
        />
      ) : null}

      {!isLoadingOverview && overviewError ? (
        <View style={styles.retryCard}>
          <MessageCard title="Could not load resume status" message={overviewError} tone="error" />
          <HapticPressable
            onPress={loadResumeOverview}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </HapticPressable>
        </View>
      ) : null}

      {isBlockedByResumeLimit ? (
        <FreeLimitCard
          benefits={RESUME_LIMIT_BENEFITS}
          countdownLabel="Next free scan in"
          message={
            analysis
              ? "Your previous resume check is saved below. Upgrade to Premium for more scans or wait for the next free scan."
              : "Upgrade to Premium for more scans or wait for the next free scan."
          }
          onUpgrade={() => navigation.navigate("Paywall")}
          resetCountdown={resumeResetCountdown}
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
          title="Premium sync pending"
        />
      ) : (
        <View style={styles.card}>
          <HapticPressable
            disabled={isPickingPdf}
            onPress={pickPdf}
            style={({ pressed }) => [
              styles.uploadButton,
              isPickingPdf && styles.disabledButton,
              pressed && !isPickingPdf && styles.pressed
            ]}
          >
            {isPickingPdf ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <View style={styles.uploadButtonContent}>
                <AppIcon color={COLORS.text} name="upload" size={20} />
                <Text style={styles.uploadButtonText}>
                  {selectedFile ? "Replace PDF" : "Upload PDF"}
                </Text>
              </View>
            )}
          </HapticPressable>

          {selectedFile ? (
            <View style={styles.fileBox}>
              <Text selectable style={styles.fileLabel}>
                PDF selected
              </Text>
              <Text selectable numberOfLines={2} style={styles.fileName}>
                {selectedFile.name}
              </Text>
            </View>
          ) : (
            <MessageCard
              title="PDF-first analysis"
              message="Choose a text-based PDF under 5MB. Manual paste appears only if the PDF cannot be read."
            />
          )}

          {showPasteFallback ? (
            <View style={styles.fallbackCard}>
              <View style={styles.fallbackHeader}>
                <AppIcon color={COLORS.warning} name="warning" size={20} />
                <View style={styles.fallbackCopy}>
                  <Text selectable style={styles.fallbackTitle}>
                    We could not read this PDF
                  </Text>
                  <Text selectable style={styles.helperText}>
                    Paste your resume text below so IntervueAI can still analyze the content.
                  </Text>
                </View>
              </View>
              <Text selectable style={styles.label}>
                Resume text
              </Text>
              <TextInput
                multiline
                numberOfLines={8}
                onChangeText={setResumeText}
                placeholder="Paste your resume content..."
                placeholderTextColor={COLORS.muted}
                style={styles.resumeInput}
                textAlignVertical="top"
                value={resumeText}
              />
            </View>
          ) : null}

          <JobRolePicker selectedValue={jobRole} onSelect={setJobRole} />

          {errorMessage ? (
            <MessageCard title="Resume check stopped" message={errorMessage} tone="error" />
          ) : null}

          <HapticPressable
            disabled={!jobRole || isAnalyzing || isLoadingOverview}
            onPress={analyzeSelectedResume}
            style={({ pressed }) => [
              styles.analyzeButton,
              (!jobRole || isAnalyzing || isLoadingOverview) && styles.disabledButton,
              pressed && !isAnalyzing && styles.pressed
            ]}
          >
            {isAnalyzing ? (
              <View style={styles.buttonLoadingRow}>
                <ActivityIndicator color={COLORS.text} />
                <Text style={styles.analyzeButtonText}>Analyzing...</Text>
              </View>
            ) : (
              <Text style={styles.analyzeButtonText}>
                {selectedFile ? "Analyze PDF" : "Analyze Resume"}
              </Text>
            )}
          </HapticPressable>
        </View>
      )}

      {analysis ? (
        <PreviousResumeCheckCard
          analysis={analysis}
          isOpen={showPreviousAnalysisDetails}
          onPress={() => setShowPreviousAnalysisDetails((current) => !current)}
        />
      ) : null}

      {shouldShowAnalysisDetails ? (
        <View style={styles.resultsCard}>
          <View style={styles.scoreBox}>
            <Text selectable style={[styles.atsScore, { color: atsColor }]}>
              {analysis.atsScore}
            </Text>
            <Text selectable style={styles.atsLabel}>
              ATS Score
            </Text>
            <Text selectable style={styles.atsToneText}>
              {atsToneLabel}
            </Text>
          </View>

          <View style={styles.resultSection}>
            <Text selectable style={styles.sectionTitle}>
              Missing Keywords
            </Text>
            <View style={styles.badgeRow}>
              {(analysis.missingKeywords || []).map((keyword) => (
                <KeywordBadge key={keyword} label={keyword} />
              ))}
            </View>
          </View>

          <View style={styles.resultSection}>
            <Text selectable style={styles.sectionTitle}>
              Grammar Issues
            </Text>
            {(analysis.grammarIssues || []).length ? (
              (analysis.grammarIssues || []).map((issue) => (
                <Text key={issue} selectable style={styles.grammarIssue}>
                  - {issue}
                </Text>
              ))
            ) : (
              <Text selectable style={styles.emptyResultText}>
                No obvious grammar issues found.
              </Text>
            )}
          </View>

          <View style={styles.resultSection}>
            <View style={styles.resultSectionHeader}>
              <Text selectable style={styles.sectionTitle}>
                Suggested Lines to Add
              </Text>
              <Text selectable style={styles.sectionHint}>
                Copy the strongest lines into the right resume section.
              </Text>
            </View>
            {(analysis.rewriteSuggestions || []).length ? (
              (analysis.rewriteSuggestions || []).map((suggestion, index) => (
                <View key={`${suggestion}-${index}`} style={styles.rewriteCard}>
                  <Text selectable style={styles.rewriteIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                  <Text selectable style={styles.rewriteSuggestion}>
                    {suggestion}
                  </Text>
                </View>
              ))
            ) : (
              <Text selectable style={styles.emptyResultText}>
                No suggested lines were returned for this resume.
              </Text>
            )}
          </View>

          <View style={styles.resultSection}>
            <Text selectable style={styles.sectionTitle}>
              Section Feedback
            </Text>
            {Object.entries(SECTION_LABELS).map(([key, label]) => (
              <SectionFeedbackCard
                key={key}
                title={label}
                value={analysis.sectionFeedback?.[key]}
              />
            ))}
          </View>

          {!isBlockedByResumeLimit ? (
            <HapticPressable
              onPress={resetScreen}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Analyze Another</Text>
            </HapticPressable>
          ) : null}
        </View>
      ) : null}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  analyzeButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 18
  },
  analyzeButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900"
  },
  atsLabel: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  atsScore: {
    fontSize: 46,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 54
  },
  atsToneText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 18,
    padding: 18
  },
  chevron: {
    color: COLORS.accent,
    fontSize: 13,
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
  disabledButton: {
    opacity: 0.45
  },
  buttonLoadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  errorMessageCard: {
    borderColor: "rgba(239, 68, 68, 0.35)"
  },
  emptyResultText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
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
  fallbackTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  feedbackHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  feedbackItem: {
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  feedbackText: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22
  },
  feedbackTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  field: {
    gap: 10
  },
  fileBox: {
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    padding: 14
  },
  fileLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  fileName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800"
  },
  grammarIssue: {
    color: COLORS.yellow,
    fontSize: 15,
    lineHeight: 22
  },
  header: {
    gap: 8,
    paddingTop: 8
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  keywordBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.42)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  keywordBadgeText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "900"
  },
  label: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  messageCard: {
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14
  },
  messageText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  messageTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900"
  },
  optionRow: {
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  optionRowSelected: {
    backgroundColor: "rgba(108, 99, 255, 0.18)"
  },
  optionText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800"
  },
  optionTextSelected: {
    color: COLORS.accent,
    fontWeight: "900"
  },
  optionsPanel: {
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden"
  },
  placeholderText: {
    color: COLORS.muted,
    fontWeight: "700"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  previousCheckCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: "rgba(108, 99, 255, 0.35)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 16
  },
  previousCheckCopy: {
    flex: 1,
    gap: 5
  },
  previousCheckAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  previousCheckHint: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  previousCheckLabel: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  previousCheckMeta: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18
  },
  previousCheckTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900"
  },
  resultSection: {
    gap: 12
  },
  resultSectionHeader: {
    gap: 5
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.accent,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  retryButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900"
  },
  retryCard: {
    gap: 12
  },
  rewriteCard: {
    alignItems: "flex-start",
    backgroundColor: "rgba(108, 99, 255, 0.12)",
    borderColor: "rgba(108, 99, 255, 0.35)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12
  },
  rewriteIndex: {
    color: COLORS.accent,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 21
  },
  rewriteSuggestion: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21
  },
  resumeInput: {
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 170,
    padding: 14
  },
  resultsCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 20,
    padding: 18
  },
  scoreBox: {
    alignItems: "center",
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 20
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.accent,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900"
  },
  sectionHint: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  selectButton: {
    alignItems: "center",
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: 16
  },
  selectText: {
    color: COLORS.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800"
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 35
  },
  uploadButton: {
    alignItems: "center",
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.accent,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 74,
    paddingHorizontal: 18
  },
  uploadButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  uploadButtonText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  }
});
