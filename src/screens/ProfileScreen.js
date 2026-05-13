import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Share, StyleSheet, Switch, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";

import AppCard from "../components/ui/AppCard";
import AppIcon from "../components/ui/AppIcon";
import AppText from "../components/ui/AppText";
import IconButton from "../components/ui/IconButton";
import ListRow from "../components/ui/ListRow";
import MessageCard from "../components/ui/MessageCard";
import MetricCard from "../components/ui/MetricCard";
import Screen from "../components/ui/Screen";
import SectionHeader from "../components/ui/SectionHeader";
import SkeletonLine from "../components/ui/SkeletonLine";
import StatusPill from "../components/ui/StatusPill";
import { getCurrentUser, signOut } from "../services/authService";
import {
  getDailyPracticeReminderEnabled,
  setDailyPracticeReminderEnabled
} from "../services/notificationService";
import {
  calculateAverageScore,
  calculateCurrentStreak,
  fetchUserSessions
} from "../services/sessionService";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useUserStore } from "../store/userStore";
import { COLORS, useAppTheme } from "../theme";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.prepai.prepai";
const APP_CONFIG_EXTRA = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
const PRIVACY_POLICY_URL =
  APP_CONFIG_EXTRA.privacyPolicyUrl || "https://example.com/prepai/privacy";
const TERMS_URL = APP_CONFIG_EXTRA.termsUrl || "https://example.com/prepai/terms";
const SUPPORT_EMAIL = APP_CONFIG_EXTRA.supportEmail || "support@example.com";

const getInitials = (name, email) => {
  const source = name?.trim() || email?.split("@")[0] || "IntervueAI";
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const isPlaceholderValue = (value) =>
  !value || value.includes("example.com") || value === "support@example.com";

export default function ProfileScreen({ navigation }) {
  const { colors } = useAppTheme();
  const profile = useUserStore((state) => state.profile);
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const isSubscriptionLoading = useSubscriptionStore((state) => state.isLoading);
  const refreshSubscriptionStatus = useSubscriptionStore(
    (state) => state.refreshSubscriptionStatus
  );
  const user = getCurrentUser();
  const displayName =
    profile.fullName?.trim() ||
    profile.name?.trim() ||
    user?.displayName?.trim() ||
    "IntervueAI User";
  const email = user?.email || "Email not available";
  const initials = useMemo(() => getInitials(displayName, email), [displayName, email]);
  const [stats, setStats] = useState({
    averageScore: 0,
    currentStreak: 0,
    totalSessions: 0
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [isReminderSaving, setIsReminderSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const loadProfileStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      setStatsError("");

      const sessions = await fetchUserSessions();

      setStats({
        averageScore: calculateAverageScore(sessions),
        currentStreak: calculateCurrentStreak(sessions),
        totalSessions: sessions.length
      });
    } catch (error) {
      setStatsError(error.message || "Could not load profile stats.");
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const loadReminderState = useCallback(async () => {
    try {
      const enabled = await getDailyPracticeReminderEnabled();
      setIsReminderEnabled(enabled);
    } catch {
      setIsReminderEnabled(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileStats();
      loadReminderState();
      refreshSubscriptionStatus().catch(() => {});
    }, [loadProfileStats, loadReminderState, refreshSubscriptionStatus])
  );

  const editProfile = () => {
    navigation.navigate("ProfileSetup", {
      mode: "edit",
      returnToProfile: true
    });
  };

  const toggleDailyReminder = async (enabled) => {
    if (isReminderSaving) {
      return;
    }

    try {
      setIsReminderSaving(true);
      const nextEnabled = await setDailyPracticeReminderEnabled(enabled);
      setIsReminderEnabled(nextEnabled);

      if (enabled && !nextEnabled) {
        Alert.alert("Notifications off", "Please allow notifications to enable daily reminders.");
      }
    } catch (error) {
      Alert.alert("Reminder failed", error.message || "Could not update notification settings.");
    } finally {
      setIsReminderSaving(false);
    }
  };

  const rateApp = async () => {
    try {
      await Linking.openURL(PLAY_STORE_URL);
    } catch {
      Alert.alert("Unable to open link", "Please try again later.");
    }
  };

  const shareApp = async () => {
    try {
      await Share.share({
        message: `Practice smarter. Interview better. Try IntervueAI: ${PLAY_STORE_URL}`
      });
    } catch (error) {
      Alert.alert("Share failed", error.message || "Could not open sharing options.");
    }
  };

  const openLegalUrl = async (title, url) => {
    if (isPlaceholderValue(url)) {
      Alert.alert(title, "This link is not configured yet. Please check again later.");
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open link", "Please try again later.");
    }
  };

  const contactSupport = async () => {
    if (isPlaceholderValue(SUPPORT_EMAIL)) {
      Alert.alert("Support", "Support email is not configured yet. Please check again later.");
      return;
    }

    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
    } catch {
      Alert.alert("Unable to open email", "Please try again later.");
    }
  };

  const handleLogout = async () => {
    if (isSigningOut) {
      return;
    }

    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      Alert.alert("Logout failed", error.message || "Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <AppCard gradient="calm" style={styles.profileCard}>
        <View pointerEvents="none" style={styles.profileGlow} />
        <View style={styles.profileTopRow}>
          <View style={styles.avatarFrame}>
            <View style={styles.avatar}>
              <AppText variant="cardTitle">{initials}</AppText>
            </View>
          </View>
          <View style={styles.profileText}>
            <AppText numberOfLines={2} variant="sectionTitle">
              {displayName}
            </AppText>
            <AppText numberOfLines={1} tone="muted" variant="bodyMuted">
              {email}
            </AppText>
          </View>
          <IconButton accessibilityLabel="Edit profile" icon="edit" onPress={editProfile} />
        </View>
        <View style={styles.profileDivider} />
        <View style={styles.profileMeta}>
          <View style={styles.rolePill}>
            <AppIcon color={colors.primary} name="briefcase" size={15} />
            <AppText numberOfLines={1} tone="muted" variant="caption">
              {profile.jobRole || "Job role not set"} -{" "}
              {profile.experienceLevel || "Experience not set"}
            </AppText>
          </View>
          <StatusPill
            icon={isSubscriptionLoading ? "refresh" : isPremium ? "success" : "lock"}
            label={isSubscriptionLoading ? "Checking" : isPremium ? "Premium" : "Free"}
            tone={isPremium ? "success" : "default"}
          />
        </View>
      </AppCard>

      <View style={styles.statsRow}>
        {isStatsLoading ? (
          ["sessions", "score", "streak"].map((item) => (
            <AppCard key={item} style={styles.statCard}>
              <SkeletonLine height={24} width="84%" />
              <SkeletonLine height={12} width="70%" />
            </AppCard>
          ))
        ) : (
          <>
            <MetricCard icon="practice" label="Sessions" value={String(stats.totalSessions)} />
            <MetricCard icon="star" label="Average" value={stats.averageScore.toFixed(1)} />
            <MetricCard icon="calendar" label="Streak" value={String(stats.currentStreak)} />
          </>
        )}
      </View>

      {statsError ? (
        <MessageCard message={statsError} title="Profile stats unavailable" tone="error" />
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Practice" />
        <AppCard style={styles.sectionCard}>
          <ListRow
            icon="notification"
            label="Notification Settings"
            detail="Daily reminder at 9:00 AM"
            right={
              isReminderSaving ? (
                <ActivityIndicator color={COLORS.secondaryStrong} />
              ) : (
                <Switch
                  onValueChange={toggleDailyReminder}
                  thumbColor={isReminderEnabled ? COLORS.text : COLORS.textSoft}
                  trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
                  value={isReminderEnabled}
                />
              )
            }
          />
          <ListRow
            icon="premium"
            label={isPremium ? "Manage Premium" : "Upgrade to Premium"}
            detail={isPremium ? "Premium is active" : "Unlock unlimited practice"}
            onPress={() => navigation.navigate("Paywall")}
          />
        </AppCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Account" />
        <AppCard style={styles.sectionCard}>
          <ListRow icon="badge" label="Rate the App" onPress={rateApp} />
          <ListRow icon="share" label="Share App" onPress={shareApp} />
          <ListRow
            destructive
            icon="logout"
            label={isSigningOut ? "Logging out..." : "Logout"}
            onPress={handleLogout}
            right={isSigningOut ? <ActivityIndicator color={COLORS.danger} /> : null}
          />
        </AppCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Legal" />
        <AppCard style={styles.sectionCard}>
          <ListRow
            icon="document"
            label="Privacy Policy"
            detail={isPlaceholderValue(PRIVACY_POLICY_URL) ? "Not configured yet" : "View details"}
            onPress={() => openLegalUrl("Privacy Policy", PRIVACY_POLICY_URL)}
          />
          <ListRow
            icon="document"
            label="Terms of Service"
            detail={isPlaceholderValue(TERMS_URL) ? "Not configured yet" : "View details"}
            onPress={() => openLegalUrl("Terms of Service", TERMS_URL)}
          />
          <ListRow
            icon="mail"
            label="Contact Us"
            detail={
              isPlaceholderValue(SUPPORT_EMAIL) ? "Not configured yet" : "Get help from support"
            }
            onPress={contactSupport}
          />
        </AppCard>
      </View>

      <AppText style={styles.version} tone="muted" variant="bodyMuted">
        IntervueAI v1.0.0
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(98, 214, 255, 0.14)",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  avatarFrame: {
    alignItems: "center",
    backgroundColor: "rgba(98, 214, 255, 0.08)",
    borderColor: "rgba(98, 214, 255, 0.22)",
    borderRadius: 30,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    width: 58
  },
  content: {
    gap: 14,
    paddingBottom: 108
  },
  profileCard: {
    gap: 10,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 24
  },
  profileDivider: {
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    height: 1
  },
  profileGlow: {
    backgroundColor: "rgba(98, 214, 255, 0.16)",
    borderRadius: 120,
    height: 132,
    position: "absolute",
    right: -64,
    top: -70,
    width: 132
  },
  profileMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  profileTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    minWidth: 0
  },
  profileText: {
    flex: 1,
    gap: 5
  },
  rolePill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(98, 214, 255, 0.11)",
    borderColor: "rgba(98, 214, 255, 0.14)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  section: {
    gap: 10
  },
  sectionCard: {
    borderRadius: 18,
    gap: 8,
    padding: 8
  },
  statCard: {
    alignItems: "center",
    borderRadius: 18,
    flex: 1,
    gap: 4,
    justifyContent: "center",
    minHeight: 74,
    padding: 9
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  version: {
    textAlign: "center"
  }
});
