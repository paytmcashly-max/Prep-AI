import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

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
import { useUserStore } from "../store/userStore";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.prepai.prepai";

const COLORS = {
  accent: "#6C63FF",
  background: "#0A0A0A",
  border: "#2A2A2A",
  card: "#1A1A1A",
  danger: "#EF4444",
  muted: "#A3A3A3",
  text: "#FFFFFF"
};

const getInitials = (name, email) => {
  const source = name?.trim() || email?.split("@")[0] || "PrepAI";
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

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

function SettingRow({ label, detail, onPress, right, destructive }) {
  return (
    <Pressable
      disabled={!onPress && !right}
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && onPress && styles.pressed]}
    >
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
      {right || (onPress ? <Text style={styles.chevron}>›</Text> : null)}
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }) {
  const profile = useUserStore((state) => state.profile);
  const user = getCurrentUser();
  const displayName = user?.displayName?.trim() || profile.fullName || profile.name || "PrepAI User";
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
    }, [loadProfileStats, loadReminderState])
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
              {profile.jobRole || "Job role not set"} · {profile.experienceLevel || "Experience not set"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {isStatsLoading ? (
          <View style={styles.loadingStats}>
            <ActivityIndicator color={COLORS.accent} />
            <Text selectable style={styles.loadingText}>
              Loading stats...
            </Text>
          </View>
        ) : (
          <>
            <StatCard label="Total Sessions" value={String(stats.totalSessions)} />
            <StatCard label="Average Score" value={stats.averageScore.toFixed(1)} />
            <StatCard label="Current Streak" value={`${stats.currentStreak} \uD83D\uDD25`} />
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
          <SettingRow label="Edit Profile" onPress={editProfile} />
          <SettingRow
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
            label={"Upgrade to Premium \uD83D\uDC51"}
            detail="Unlock unlimited practice"
            onPress={() => navigation.navigate("Paywall")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text selectable style={styles.sectionTitle}>
          Account
        </Text>
        <View style={styles.sectionCard}>
          <SettingRow label={"Rate the App \u2B50"} onPress={rateApp} />
          <SettingRow label="Share App" onPress={shareApp} />
          <SettingRow
            destructive
            label={isSigningOut ? "Logging out..." : "Logout"}
            onPress={handleLogout}
            right={isSigningOut ? <ActivityIndicator color={COLORS.danger} /> : null}
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
  chevron: {
    color: COLORS.muted,
    fontSize: 28,
    fontWeight: "600"
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
  loadingStats: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 90,
    padding: 14
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "800"
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
