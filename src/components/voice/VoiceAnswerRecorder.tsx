// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState
} from "expo-audio";

import AppButton from "../ui/AppButton";
import AppCard from "../ui/AppCard";
import AppIcon from "../ui/AppIcon";
import AppText from "../ui/AppText";
import Badge from "../ui/Badge";
import MessageCard from "../ui/MessageCard";
import { MAX_VOICE_RECORDING_DURATION_MILLIS } from "../../services/voiceConstants";
import { RADIUS, SPACING, useAppTheme } from "../../theme";

type VoiceRecorderStatus =
  | "idle"
  | "requestingPermission"
  | "recording"
  | "recorded"
  | "playing"
  | "uploading"
  | "transcribing"
  | "completed"
  | "error";

type SubmittedAudio = {
  uri: string;
  durationMillis: number;
  mimeType: string;
  fileName?: string;
};

type VoiceAnswerRecorderProps = {
  disabled?: boolean;
  onStartRecording?: () => Promise<void> | void;
  onSubmitAudio: (payload: SubmittedAudio) => Promise<void> | void;
};

const formatDuration = (durationMillis: number) => {
  const totalSeconds = Math.max(Math.round(durationMillis / 1000), 0);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const getMimeTypeFromUri = (uri: string) => {
  if (uri.endsWith(".webm")) {
    return "audio/webm";
  }

  if (uri.endsWith(".3gp")) {
    return "audio/3gpp";
  }

  return "audio/mp4";
};

const getStatusLabel = (status: VoiceRecorderStatus) => {
  switch (status) {
    case "requestingPermission":
      return "Waiting for microphone access";
    case "recording":
      return "Recording now";
    case "recorded":
      return "Ready to submit";
    case "playing":
      return "Playing preview";
    case "uploading":
      return "Uploading your answer";
    case "transcribing":
      return "Turning audio into text";
    case "completed":
      return "Transcript ready";
    case "error":
      return "Try again";
    case "idle":
    default:
      return "Ready when you are";
  }
};

export default function VoiceAnswerRecorder({
  disabled = false,
  onStartRecording,
  onSubmitAudio
}: VoiceAnswerRecorderProps) {
  const { colors } = useAppTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const player = useAudioPlayer(null, { updateInterval: 200 });
  const playerStatus = useAudioPlayerStatus(player);
  const [status, setStatus] = useState<VoiceRecorderStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [didReachMaxDuration, setDidReachMaxDuration] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<SubmittedAudio | null>(null);
  const autoStoppingRef = useRef(false);
  const maxDurationLabel = useMemo(() => formatDuration(MAX_VOICE_RECORDING_DURATION_MILLIS), []);

  const displayedDuration = useMemo(() => {
    const durationMillis =
      status === "recording"
        ? recorderState.durationMillis || 0
        : recordedAudio?.durationMillis || 0;

    if (status === "recording") {
      return `${formatDuration(durationMillis)} / ${maxDurationLabel}`;
    }

    return formatDuration(durationMillis);
  }, [maxDurationLabel, recordedAudio?.durationMillis, recorderState.durationMillis, status]);

  const resetAudioMode = useCallback(async () => {
    await setAudioModeAsync({
      allowsRecording: false,
      interruptionMode: "duckOthers",
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false
    });
  }, []);

  const stopPlayback = useCallback(async () => {
    try {
      player.pause();
      await player.seekTo(0);
    } catch {
      // Resetting preview playback is best-effort only.
    }
  }, [player]);

  useEffect(() => {
    if (recordedAudio?.uri) {
      player.replace({ uri: recordedAudio.uri });
    }
  }, [player, recordedAudio?.uri]);

  useEffect(() => {
    if (!playerStatus.playing && status === "playing") {
      setStatus(recordedAudio ? "recorded" : "idle");
    }
  }, [playerStatus.playing, recordedAudio, status]);

  const stopRecording = useCallback(async () => {
    try {
      await recorder.stop();
      const nextRecorderState = recorder.getStatus();
      const uri = nextRecorderState.url || recorder.uri;
      const durationMillis = nextRecorderState.durationMillis || recorderState.durationMillis || 0;

      if (!uri) {
        throw new Error("MISSING_RECORDING_URI");
      }

      const nextAudio = {
        uri,
        durationMillis,
        mimeType: getMimeTypeFromUri(uri)
      };

      setRecordedAudio(nextAudio);
      setErrorMessage("");
      setStatus("recorded");
      player.replace({ uri });
      await player.seekTo(0);
    } catch {
      setErrorMessage("Recording failed. Please try again.");
      setStatus("error");
    } finally {
      await resetAudioMode().catch(() => null);
    }
  }, [player, recorder, recorderState.durationMillis, resetAudioMode]);

  useEffect(() => {
    if (status !== "recording") {
      autoStoppingRef.current = false;
      return;
    }

    if (
      recorderState.durationMillis >= MAX_VOICE_RECORDING_DURATION_MILLIS &&
      !autoStoppingRef.current
    ) {
      autoStoppingRef.current = true;
      setDidReachMaxDuration(true);
      void stopRecording();
    }
  }, [recorderState.durationMillis, status, stopRecording]);

  useEffect(() => {
    if (disabled && status === "recording") {
      void stopRecording();
    }
  }, [disabled, status, stopRecording]);

  const startRecording = useCallback(async () => {
    if (disabled) {
      return;
    }

    try {
      setErrorMessage("");
      setDidReachMaxDuration(false);
      autoStoppingRef.current = false;
      await onStartRecording?.();
      const existingPermission = await getRecordingPermissionsAsync();

      if (!existingPermission.granted) {
        setStatus("requestingPermission");
        const requestedPermission = await requestRecordingPermissionsAsync();

        if (!requestedPermission.granted) {
          setErrorMessage(
            "Microphone permission denied. Allow microphone access to record your answer."
          );
          setStatus("error");
          return;
        }
      }

      await stopPlayback();
      await setAudioModeAsync({
        allowsRecording: true,
        interruptionMode: "duckOthers",
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordedAudio(null);
      setStatus("recording");
    } catch {
      setErrorMessage("Recording failed. Please try again.");
      setStatus("error");
      await resetAudioMode().catch(() => null);
    }
  }, [disabled, onStartRecording, recorder, resetAudioMode, stopPlayback]);

  const togglePlayback = useCallback(async () => {
    if (!recordedAudio || disabled) {
      return;
    }

    try {
      setErrorMessage("");

      if (playerStatus.playing) {
        await stopPlayback();
        setStatus("recorded");
        return;
      }

      player.replace({ uri: recordedAudio.uri });
      await player.seekTo(0);
      player.play();
      setStatus("playing");
    } catch {
      setErrorMessage("Playback failed. Please try again.");
      setStatus("error");
    }
  }, [disabled, player, playerStatus.playing, recordedAudio, stopPlayback]);

  const retakeRecording = useCallback(async () => {
    await stopPlayback();
    setRecordedAudio(null);
    setDidReachMaxDuration(false);
    setErrorMessage("");
    setStatus("idle");
  }, [stopPlayback]);

  const submitAudio = useCallback(async () => {
    if (!recordedAudio || disabled) {
      return;
    }

    try {
      setErrorMessage("");
      setStatus("uploading");
      await Promise.resolve();
      setStatus("transcribing");
      await onSubmitAudio(recordedAudio);
      setStatus("completed");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not submit your voice answer."
      );
      setStatus("error");
    }
  }, [disabled, onSubmitAudio, recordedAudio]);

  return (
    <AppCard style={styles.card} tone="subtle">
      <View style={styles.header}>
        <Badge icon="mic" label="Private testing" />
        <View
          style={[
            styles.iconBubble,
            { backgroundColor: colors.primarySoft, borderColor: colors.border }
          ]}
        >
          <AppIcon
            color={colors.primary}
            name={status === "recording" ? "stop" : "mic"}
            size={22}
          />
        </View>
        <View style={styles.headerCopy}>
          <AppText variant="sectionTitle">Voice answer testing</AppText>
          <AppText tone="muted" variant="bodyMuted">
            Record one answer, review the transcript, then send it through the interview evaluation
            flow. This feature is currently under testing.
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.statusPanel,
          { backgroundColor: colors.card, borderColor: colors.borderStrong }
        ]}
      >
        <AppText tone="muted" variant="caption">
          {status === "recording" ? "Recording length" : "Clip length"}
        </AppText>
        <AppText variant="statNumber">{displayedDuration}</AppText>
        <AppText style={styles.statusText} tone="muted" variant="bodyMuted">
          {didReachMaxDuration
            ? "Reached the 2 minute beta limit. Submit this take or retake it."
            : getStatusLabel(status)}
        </AppText>
        <AppText style={styles.statusText} tone="muted" variant="caption">
          Max {maxDurationLabel}
        </AppText>
      </View>

      {errorMessage ? (
        <MessageCard message={errorMessage} title="Voice recorder" tone="error" />
      ) : null}

      {status === "requestingPermission" ? (
        <View
          style={[
            styles.permissionRow,
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}
        >
          <ActivityIndicator color={colors.primary} />
          <AppText tone="muted" variant="bodyMuted">
            Requesting microphone access...
          </AppText>
        </View>
      ) : null}

      {!recordedAudio ? (
        <AppButton
          disabled={disabled || status === "requestingPermission"}
          icon={status === "recording" ? "stop" : "mic"}
          onPress={status === "recording" ? stopRecording : startRecording}
        >
          {status === "recording" ? "Stop Recording" : "Start Recording"}
        </AppButton>
      ) : (
        <View style={styles.actions}>
          <AppButton
            disabled={disabled || status === "uploading" || status === "transcribing"}
            icon={status === "playing" ? "stop" : "play"}
            onPress={togglePlayback}
            style={styles.actionButton}
            tone="secondary"
          >
            {status === "playing" ? "Stop Playback" : "Play Recording"}
          </AppButton>
          <AppButton
            disabled={disabled || status === "uploading" || status === "transcribing"}
            icon="retry"
            onPress={retakeRecording}
            style={styles.actionButton}
            tone="secondary"
          >
            Retake
          </AppButton>
          <AppButton
            disabled={disabled || status === "playing"}
            icon="send"
            loading={status === "uploading" || status === "transcribing"}
            onPress={submitAudio}
            style={styles.submitButton}
          >
            Submit Voice Answer
          </AppButton>
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    minWidth: 136
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md
  },
  card: {
    gap: SPACING.lg
  },
  header: {
    gap: SPACING.md
  },
  headerCopy: {
    gap: SPACING.xs
  },
  iconBubble: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  permissionRow: {
    alignItems: "center",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.md,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: SPACING.lg
  },
  statusPanel: {
    alignItems: "center",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl
  },
  statusText: {
    textAlign: "center"
  },
  submitButton: {
    width: "100%"
  }
});
