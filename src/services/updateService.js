import { Alert } from "react-native";

let hasCheckedForUpdate = false;
let cachedUpdatesModule;

const isDevelopment = () => typeof __DEV__ !== "undefined" && __DEV__;

const getUpdatesModule = () => {
  if (cachedUpdatesModule !== undefined) {
    return cachedUpdatesModule;
  }

  try {
    // Older installed dev clients may not include expo-updates yet. Keep OTA checks
    // optional so a JS bundle cannot crash before the user reaches the app.
    cachedUpdatesModule = require("expo-updates");
  } catch {
    cachedUpdatesModule = null;
  }

  return cachedUpdatesModule;
};

export const checkForAppUpdate = async () => {
  if (isDevelopment() || hasCheckedForUpdate) {
    return;
  }

  hasCheckedForUpdate = true;

  try {
    const Updates = getUpdatesModule();

    if (!Updates) {
      return;
    }

    if (!Updates.isEnabled) {
      return;
    }

    const update = await Updates.checkForUpdateAsync();

    if (!update.isAvailable) {
      return;
    }

    Alert.alert("Update available", "A new PrepAI update is ready.", [
      {
        style: "cancel",
        text: "Later"
      },
      {
        onPress: async () => {
          try {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          } catch {
            // OTA update failures should not block the app.
          }
        },
        text: "Update now"
      }
    ]);
  } catch {
    // OTA update checks are best-effort and should fail silently.
  }
};
