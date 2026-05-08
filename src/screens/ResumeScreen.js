import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

import HapticPressable from "../components/HapticPressable";
import { trackEvent } from "../services/analyticsService";
import { analyzeResume, analyzeResumePdf } from "../services/openaiService";
import { validateResumePdfAsset } from "../services/resumeService";
import { useUserStore } from "../store/userStore";

const JOB_ROLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Android Developer",
  "Data Scientist",
  "MBA/Management"
];

const COLORS = {
  accent: "#6C63FF",
  background: "#0A0A0A",
  card: "#1A1A1A",
  border: "#2A2A2A",
  muted: "#A3A3A3",
  text: "#FFFFFF",
  green: "#22C55E",
  yellow: "#FACC15",
  red: "#EF4444"
};

const SECTION_LABELS = {
  summary: "Summary",
  experience: "Experience",
  skills: "Skills",
  education: "Education"
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
        <Text style={styles.chevron}>{isOpen ? "Up" : "Down"}</Text>
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

export default function ResumeScreen() {
  const savedJobRole = useUserStore((state) => state.profile.jobRole);
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jobRole, setJobRole] = useState(savedJobRole || "Full Stack Developer");
  const [isPickingPdf, setIsPickingPdf] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPasteFallback, setShowPasteFallback] = useState(false);
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
      setAnalysis(null);
      setErrorMessage("");
    } catch (error) {
      setSelectedFile(null);
      setErrorMessage(error.message || "Could not pick this PDF.");
    } finally {
      setIsPickingPdf(false);
    }
  };

  const analyzeSelectedResume = async () => {
    if (!selectedFile && !resumeText.trim()) {
      Alert.alert("Add resume", "Please upload a PDF or paste your resume text first.");
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
      setIsAnalyzing(true);
      setErrorMessage("");
      setAnalysis(null);
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

      setAnalysis(result);
      trackEvent("resume_analysis_completed", {
        atsScore: Number(result.atsScore || 0),
        inputType: selectedFile ? "pdf" : "text",
        jobRole
      });
    } catch (error) {
      setErrorMessage(error.message || "Could not analyze this resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScreen = () => {
    setSelectedFile(null);
    setResumeText("");
    setAnalysis(null);
    setErrorMessage("");
    setIsAnalyzing(false);
    setShowPasteFallback(false);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      onTouchStart={Keyboard.dismiss}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Resume Analyzer
        </Text>
        <Text selectable style={styles.subtitle}>
          Upload a text-based PDF resume for backend analysis, or paste resume text as a development
          fallback.
        </Text>
      </View>

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
            <Text style={styles.uploadButtonText}>Upload PDF</Text>
          )}
        </HapticPressable>

        {selectedFile ? (
          <View style={styles.fileBox}>
            <Text selectable style={styles.fileLabel}>
              PDF selected
            </Text>
            <Text selectable style={styles.fileName}>
              {selectedFile.name}
            </Text>
          </View>
        ) : (
          <MessageCard
            title="No PDF selected"
            message="Choose a text-based PDF under 5MB, or use the paste fallback."
          />
        )}

        <HapticPressable
          onPress={() => setShowPasteFallback((current) => !current)}
          style={({ pressed }) => [styles.fallbackButton, pressed && styles.pressed]}
        >
          <Text style={styles.fallbackButtonText}>
            {showPasteFallback ? "Hide Paste Text Fallback" : "Paste Resume Text Instead"}
          </Text>
        </HapticPressable>

        {showPasteFallback ? (
          <View style={styles.field}>
            <Text selectable style={styles.label}>
              Paste your resume text here
            </Text>
            <Text selectable style={styles.helperText}>
              Use this if your PDF is scanned, image-only, or fails text extraction.
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
          disabled={!jobRole || isAnalyzing}
          onPress={analyzeSelectedResume}
          style={({ pressed }) => [
            styles.analyzeButton,
            (!jobRole || isAnalyzing) && styles.disabledButton,
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

      {analysis ? (
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
            <Text selectable style={styles.sectionTitle}>
              Suggested Lines to Add
            </Text>
            {(analysis.rewriteSuggestions || []).length ? (
              (analysis.rewriteSuggestions || []).map((suggestion) => (
                <Text key={suggestion} selectable style={styles.rewriteSuggestion}>
                  {suggestion}
                </Text>
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

          <HapticPressable
            onPress={resetScreen}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Analyze Another</Text>
          </HapticPressable>
        </View>
      ) : null}
    </ScrollView>
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
    fontSize: 54,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 62
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
    borderRadius: 8,
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
    color: "#FCA5A5",
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
  fallbackButton: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  fallbackButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900"
  },
  feedbackHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  feedbackItem: {
    backgroundColor: "#111111",
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
    backgroundColor: "#111111",
    borderColor: COLORS.border,
    borderRadius: 8,
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
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "900"
  },
  label: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  messageCard: {
    backgroundColor: "#111111",
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
    backgroundColor: "#111111",
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
  resultSection: {
    gap: 12
  },
  rewriteSuggestion: {
    backgroundColor: "rgba(108, 99, 255, 0.12)",
    borderColor: "rgba(108, 99, 255, 0.35)",
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    padding: 12
  },
  resumeInput: {
    backgroundColor: "#111111",
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
    borderRadius: 8,
    borderWidth: 1,
    gap: 20,
    padding: 18
  },
  scoreBox: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 20
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#111111",
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
  selectButton: {
    alignItems: "center",
    backgroundColor: "#111111",
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
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 39
  },
  uploadButton: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: COLORS.accent,
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 74,
    paddingHorizontal: 18
  },
  uploadButtonText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  }
});
