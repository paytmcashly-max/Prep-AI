import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, firestore } from "./firebaseConfig";

const DAILY_PRACTICE_NOTIFICATION_TYPE = "daily_interview_practice";
const DEFAULT_NOTIFICATION_CHANNEL_ID = "prepai-practice-high-v2";
const SESSION_COMPLETE_NOTIFICATION_KEY_PREFIX = "session_complete_notification_date";

let setupUid = null;
let notificationsModule = null;
let notificationHandlerRegistered = false;

const isExpoGo = () => Constants.appOwnership === "expo";

const isDevelopment = () => typeof __DEV__ !== "undefined" && __DEV__;

const getTodayDateKey = () => new Date().toISOString().slice(0, 10);

const getSessionCompleteNotificationKey = (uid) =>
  `${SESSION_COMPLETE_NOTIFICATION_KEY_PREFIX}_${uid || "anonymous"}`;

const logNotificationDebug = (message, metadata = {}) => {
  if (isDevelopment()) {
    console.log("Notifications:", {
      message,
      ...metadata
    });
  }
};

const getScheduledNotificationType = (notification) =>
  notification?.request?.content?.data?.type || notification?.content?.data?.type;

const registerNotificationHandler = (Notifications) => {
  if (notificationHandlerRegistered) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });
  notificationHandlerRegistered = true;
};

const getNotificationsModule = async () => {
  if (isExpoGo()) {
    // Expo Go SDK 53+ does not support Android remote push notifications.
    // Development/preview builds still load expo-notifications normally.
    return null;
  }

  if (!notificationsModule) {
    notificationsModule = await import("expo-notifications");
    registerNotificationHandler(notificationsModule);
  }

  return notificationsModule;
};

void getNotificationsModule();

const configureAndroidChannel = async () => {
  if (Platform.OS !== "android") {
    return;
  }

  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return;
  }

  await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
    name: "PrepAI practice alerts",
    description: "High-priority practice reminders and session completion alerts.",
    importance:
      Notifications.AndroidImportance.MAX ||
      Notifications.AndroidImportance.HIGH ||
      Notifications.AndroidImportance.DEFAULT,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#6C63FF",
    lockscreenVisibility:
      Notifications.AndroidNotificationVisibility?.PUBLIC ||
      Notifications.AndroidNotificationVisibility?.DEFAULT
  });

  const channels = await Notifications.getNotificationChannelsAsync();
  logNotificationDebug("android channels", {
    channels: channels.map((channel) => ({
      id: channel.id,
      importance: channel.importance,
      name: channel.name
    }))
  });
};

const requestNotificationPermissions = async () => {
  await configureAndroidChannel();

  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return false;
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  logNotificationDebug("permission status", { status });

  return status === "granted";
};

const getExpoPushToken = async () => {
  if (!Device.isDevice) {
    return null;
  }

  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return null;
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return tokenResponse.data;
};

const savePushToken = async (uid, pushToken) => {
  if (!uid || !pushToken) {
    return;
  }

  await setDoc(
    doc(firestore, "users", uid),
    {
      pushToken,
      pushTokenUpdatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const getDailyPracticeReminderEnabled = async () => {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return false;
  }

  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  return scheduledNotifications.some(
    (notification) =>
      getScheduledNotificationType(notification) === DAILY_PRACTICE_NOTIFICATION_TYPE
  );
};

export const cancelDailyPracticeNotification = async () => {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return;
  }

  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const dailyNotifications = scheduledNotifications.filter(
    (notification) =>
      getScheduledNotificationType(notification) === DAILY_PRACTICE_NOTIFICATION_TYPE
  );

  await Promise.all(
    dailyNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    )
  );
};

export const scheduleDailyPracticeNotification = async () => {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return;
  }

  const alreadyScheduled = await getDailyPracticeReminderEnabled();

  if (alreadyScheduled) {
    return;
  }

  const scheduledNotificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily Interview Practice \uD83D\uDD25",
      body: "Keep your streak alive! Practice today's questions.",
      data: { type: DAILY_PRACTICE_NOTIFICATION_TYPE },
      channelId: DEFAULT_NOTIFICATION_CHANNEL_ID,
      sound: "default"
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
      channelId: DEFAULT_NOTIFICATION_CHANNEL_ID
    }
  });

  logNotificationDebug("scheduled daily reminder", {
    scheduledNotificationId
  });
};

export const setDailyPracticeReminderEnabled = async (enabled) => {
  if (!enabled) {
    await cancelDailyPracticeNotification();
    return false;
  }

  const hasPermission = await requestNotificationPermissions();

  if (!hasPermission) {
    return false;
  }

  await scheduleDailyPracticeNotification();
  return true;
};

export const showSessionCompleteNotification = async () => {
  try {
    const uid = auth.currentUser?.uid;
    const storageKey = getSessionCompleteNotificationKey(uid);
    const todayDateKey = getTodayDateKey();
    const lastShownDate = await AsyncStorage.getItem(storageKey);

    if (lastShownDate === todayDateKey) {
      logNotificationDebug("session completion notification skipped", {
        reason: "already shown today"
      });
      return;
    }

    const Notifications = await getNotificationsModule();

    if (!Notifications) {
      return;
    }

    const scheduledNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Great job!",
        body: "Come back tomorrow to keep your streak! \uD83D\uDD25",
        data: { type: "session_complete" },
        channelId: DEFAULT_NOTIFICATION_CHANNEL_ID,
        sound: "default"
      },
      trigger: null
    });

    logNotificationDebug("scheduled session completion notification", {
      scheduledNotificationId
    });

    await AsyncStorage.setItem(storageKey, todayDateKey);
  } catch (error) {
    logNotificationDebug("session completion notification failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const setupNotifications = async (user = auth.currentUser) => {
  const uid = user?.uid;

  if (!uid || setupUid === uid) {
    return;
  }

  if (isExpoGo()) {
    return;
  }

  try {
    const hasPermission = await requestNotificationPermissions();

    if (!hasPermission) {
      return;
    }

    setupUid = uid;

    try {
      const pushToken = await getExpoPushToken();
      await savePushToken(uid, pushToken);
    } catch (error) {
      logNotificationDebug("push token save failed; local notifications still work", {
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
    }

    await scheduleDailyPracticeNotification();
  } catch (error) {
    logNotificationDebug("notification setup failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
