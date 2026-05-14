import Constants from "expo-constants";

const getFeatureFlagValue = (key, extraKey) =>
  process.env[key] ??
  Constants.expoConfig?.extra?.[extraKey] ??
  Constants.manifest?.extra?.[extraKey];

export const isVoiceFeatureEnabled =
  getFeatureFlagValue("EXPO_PUBLIC_ENABLE_VOICE_FEATURE", "enableVoiceFeature") === "true";

// TODO(voice): Keep future mobile voice interview entry points behind this flag
// until backend routes, permissions, and QA are ready for rollout.
