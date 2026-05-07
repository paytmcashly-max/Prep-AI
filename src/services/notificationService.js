import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, firestore } from "./firebaseConfig";

const DAILY_PRACTICE_NOTIFICATION_TYPE = "daily_interview_practice";
const DAILY_PRACTICE_CHANNEL_ID = "daily-practice";

let setupUid = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

const configureAndroidChannel = async () => {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(DAILY_PRACTICE_CHANNEL_ID, {
    name: "Daily practice reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#6C63FF"
  });
};

const requestNotificationPermissions = async () => {
  await configureAndroidChannel();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  return status === "granted";
};

const getExpoPushToken = async () => {
  if (Constants.appOwnership === "expo") {
    console.log("Skipping remote push token in Expo Go. Use an EAS development build for push tokens.");
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

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
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  return scheduledNotifications.some(
    (notification) =>
      notification.request.content.data?.type === DAILY_PRACTICE_NOTIFICATION_TYPE
  );
};

export const cancelDailyPracticeNotification = async () => {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const dailyNotifications = scheduledNotifications.filter(
    (notification) =>
      notification.request.content.data?.type === DAILY_PRACTICE_NOTIFICATION_TYPE
  );

  await Promise.all(
    dailyNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    )
  );
};

export const scheduleDailyPracticeNotification = async () => {
  const alreadyScheduled = await getDailyPracticeReminderEnabled();

  if (alreadyScheduled) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily Interview Practice \uD83D\uDD25",
      body: "Keep your streak alive! Practice today's questions.",
      data: { type: DAILY_PRACTICE_NOTIFICATION_TYPE }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
      channelId: DAILY_PRACTICE_CHANNEL_ID
    }
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
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Great job!",
        body: "Come back tomorrow to keep your streak! \uD83D\uDD25",
        data: { type: "session_complete" }
      },
      trigger: null
    });
  } catch (error) {
    console.log("Could not show session complete notification:", error);
  }
};

export const setupNotifications = async (user = auth.currentUser) => {
  const uid = user?.uid;

  if (!uid || setupUid === uid) {
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
      console.log("Could not save push token. Local notifications still work.", error);
    }

    await scheduleDailyPracticeNotification();
  } catch (error) {
    console.log("Notification setup failed:", error);
  }
};
