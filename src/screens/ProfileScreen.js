import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";

import HapticPressable from "../components/HapticPressable";
import SkeletonBox from "../components/SkeletonBox";
import AppIcon from "../components/ui/AppIcon";
import { getCurrentUser, signOut } from "../services/authService";
import {
  getDailyPracticeReminderEnabled,
  setDailyPracticeReminderEnabled
} from "../services/notificationService";
import { openSubscriptionManagement } from "../services/subscriptionService";
import {
  calculateAverageScore,
  calculateCurrentStreak,
  fetchUserSessions
} from "../services/sessionService";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useUserStore } from "../store/userStore";
import { COLORS } from "../theme";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.prepai.prepai";
const APP_CONFIG_EXTRA = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
const PRIVACY_POLICY_URL =
  APP_CONFIG_EXTRA.privacyPolicyUrl || "https://example.com/prepai/privacy";
const TERMS_URL = APP_CONFIG_EXTRA.termsUrl || "https://example.com/prepai/terms";
const SUPPORT_EMAIL = APP_CONFIG_EXTRA.supportEmail || "support@example.com";

const getInitials = (name, email) => {
  const source = name?.trim() || email?.split("@")[0] || "PrepAI";
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const isPlaceholderValue = (value) =>
  !value || value.includes("example.com") || value === "support@example.com";

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text selectable style={styles.statValue}>
        {value}
      </Text>
      <Text selectable style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function SettingRow({ destructive, detail, icon = "settings", label, onPress, right }) {
  return (
    <HapticPressable
      disabled={!onPress && !right}
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && onPress && styles.pressed]}
    >
      <View style={[styles.settingIcon, destructive && styles.destructiveIcon]}>
        <AppIcon color={destructive ? COLORS.dangerSoft : COLORS.accent} name={icon} size={20} />
      </View>
      <View style={styles.settingTextWrap}>
        <Text selectable style={[styles.settingLabel, destructive && styles.destructiveText]}>
          {label}
        </Text>
        {detail ? (
          <Text selectable style={styles.settingDetail}>
            {detail}
          </Text>
        ) : null}
      </View>
      {right || (onPress ? <AppIcon color={COLORS.muted} name="next" size={18} /> : null)}
    </HapticPressable>
  );
}

export default function ProfileScreen({ navigation }) {
  const profile = useUserStore((state) => state.profile);
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const isSubscriptionLoading = useSubscriptionStore((state) => state.isLoading);
  const managementUrl = useSubscriptionStore((state) => state.managementUrl);
  const refreshSubscriptionStatus = useSubscriptionStore(
    (state) => state.refreshSubscriptionStatus
  );
  const user = getCurrentUser();
  const displayName =
    profile.fullName?.trim() || profile.name?.trim() || user?.displayName?.trim() || "PrepAI User";
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
        message: `Practice interviews with PrepAI: ${PLAY_STORE_URL}`
      });
    } catch (error) {
      Alert.alert("Share failed", error.message || "Could not open sharing options.");
    }
  };

  const manageSubscription = async () => {
    try {
      await openSubscriptionManagement(managementUrl);
    } catch {
      Alert.alert(
        "Manage subscription",
        "Subscription management is unavailable for this build. If you purchased through Google Play, open Google Play Store > Payments & subscriptions > Subscriptions. If you are testing with RevenueCat Test Store, manage the test purchase from the RevenueCat dashboard."
      );
    }
  };

  const openLegalUrl = async (title, url) => {
    if (isPlaceholderValue(url)) {
      Alert.alert(title, `Placeholder URL:\n${url}`);
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
      Alert.alert("Support", `Placeholder email:\n${SUPPORT_EMAIL}`);
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
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text selectable style={styles.avatarText}>
            {initials}
          </Text>
        </View>
        <View style={styles.profileText}>
          <Text selectable style={styles.name}>
            {displayName}
          </Text>
          <Text selectable style={styles.email}>
            {email}
          </Text>
          <View style={styles.rolePill}>
            <Text selectable style={styles.roleText}>
              {profile.jobRole || "Job role not set"} -{" "}
              {profile.experienceLevel || "Experience not set"}
            </Text>
          </View>
          <View style={[styles.planCard, isPremium ? styles.premiumPlanCard : styles.freePlanCard]}>
            <View style={styles.planTextWrap}>
              <Text selectable style={styles.planEyebrow}>
                Current plan
              </Text>
              <Text selectable style={styles.planTitle}>
                {isSubscriptionLoading
                  ? "Checking plan..."
                  : isPremium
                    ? "Premium Active"
                    : "Free Plan"}
              </Text>
            </View>
            <View style={[styles.planDot, isPremium ? styles.premiumDot : styles.freeDot]} />
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {isStatsLoading ? (
          ["sessions", "score", "streak"].map((item) => (
            <View key={item} style={styles.statCard}>
              <SkeletonBox style={styles.statsSkeletonTitle} />
              <SkeletonBox style={styles.statsSkeletonLine} />
            </View>
          ))
        ) : (
          <>
            <StatCard label="Total Sessions" value={String(stats.totalSessions)} />
            <StatCard label="Average Score" value={stats.averageScore.toFixed(1)} />
            <StatCard label="Current Streak" value={String(stats.currentStreak)} />
          </>
        )}
      </View>

      {statsError ? (
        <Text selectable style={styles.errorText}>
          {statsError}
        </Text>
      ) : null}

      <View style={styles.section}>
        <Text selectable style={styles.sectionTitle}>
          Settings
        </Text>
        <View style={styles.sectionCard}>
          <SettingRow icon="edit" label="Edit Profile" onPress={editProfile} />
          <SettingRow
            icon="notification"
            label="Notification Settings"
            detail="Daily reminder at 9:00 AM"
            right={
              isReminderSaving ? (
                <ActivityIndicator color={COLORS.accent} />
              ) : (
                <Switch
                  onValueChange={toggleDailyReminder}
                  thumbColor={isReminderEnabled ? COLORS.text : "#F4F4F5"}
                  trackColor={{ false: "#3F3F46", true: COLORS.accent }}
                  value={isReminderEnabled}
                />
              )
            }
          />
          <SettingRow
            icon="premium"
            label={isPremium ? "Manage Premium" : "Upgrade to Premium"}
            detail={isPremium ? "Premium entitlement is active" : "Unlock unlimited practice"}
            onPress={() => navigation.navigate("Paywall")}
          />
          {isPremium ? (
            <SettingRow
              icon="settings"
              label="Manage Subscription"
              detail="Cancel or update from your store account"
              onPress={manageSubscription}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text selectable style={styles.sectionTitle}>
          Account
        </Text>
        <View style={styles.sectionCard}>
          <SettingRow icon="star" label="Rate the App" onPress={rateApp} />
          <SettingRow icon="share" label="Share App" onPress={shareApp} />
          <SettingRow
            destructive
            icon="logout"
            label={isSigningOut ? "Logging out..." : "Logout"}
            onPress={handleLogout}
            right={isSigningOut ? <ActivityIndicator color={COLORS.danger} /> : null}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text selectable style={styles.sectionTitle}>
          Legal
        </Text>
        <View style={styles.sectionCard}>
          <SettingRow
            icon="document"
            label="Privacy Policy"
            detail={PRIVACY_POLICY_URL}
            onPress={() => openLegalUrl("Privacy Policy", PRIVACY_POLICY_URL)}
          />
          <SettingRow
            icon="document"
            label="Terms of Service"
            detail={TERMS_URL}
            onPress={() => openLegalUrl("Terms of Service", TERMS_URL)}
          />
          <SettingRow
            icon="mail"
            label="Support Email"
            detail={SUPPORT_EMAIL}
            onPress={contactSupport}
          />
        </View>
      </View>

      <Text selectable style={styles.version}>
        PrepAI v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    width: 68
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900"
  },
  cardText: {
    color: COLORS.text
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1
  },
  content: {
    gap: 22,
    padding: 20,
    paddingBottom: 44
  },
  destructiveText: {
    color: "#FCA5A5"
  },
  destructiveIcon: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.35)"
  },
  email: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  errorText: {
    backgroundColor: "#3B1111",
    borderColor: "#7F1D1D",
    borderRadius: 8,
    borderWidth: 1,
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    padding: 14
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  statsSkeletonLine: {
    height: 12,
    width: "70%"
  },
  statsSkeletonTitle: {
    height: 24,
    width: "84%"
  },
  name: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30
  },
  pressed: {
    opacity: 0.75
  },
  freeDot: {
    backgroundColor: COLORS.muted
  },
  freePlanCard: {
    backgroundColor: "#111111",
    borderColor: COLORS.border
  },
  planCard: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  planDot: {
    borderRadius: 5,
    height: 10,
    width: 10
  },
  planEyebrow: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  planTextWrap: {
    flex: 1,
    gap: 2
  },
  planTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900"
  },
  premiumDot: {
    backgroundColor: "#22C55E"
  },
  premiumPlanCard: {
    backgroundColor: "rgba(34, 197, 94, 0.14)",
    borderColor: "rgba(34, 197, 94, 0.45)"
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 18
  },
  profileText: {
    flex: 1,
    gap: 8
  },
  rolePill: {
    alignSelf: "flex-start",
    borderColor: COLORS.accent,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  roleText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800"
  },
  section: {
    gap: 10
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden"
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900"
  },
  settingDetail: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  settingLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800"
  },
  settingIcon: {
    alignItems: "center",
    backgroundColor: "rgba(108, 99, 255, 0.12)",
    borderColor: "rgba(108, 99, 255, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  settingRow: {
    alignItems: "center",
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  settingTextWrap: {
    flex: 1,
    gap: 4
  },
  statCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    justifyContent: "center",
    minHeight: 94,
    padding: 10
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10
  },
  statValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900"
  },
  version: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  }
});
