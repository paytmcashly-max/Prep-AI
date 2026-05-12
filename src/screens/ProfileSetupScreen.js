import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";

import HapticPressable from "../components/HapticPressable";
import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppIcon from "../components/ui/AppIcon";
import AppInput from "../components/ui/AppInput";
import AppText from "../components/ui/AppText";
import { getCurrentUser } from "../services/authService";
import { firestore } from "../services/firebaseConfig";
import { useUserStore } from "../store/userStore";
import { COLORS, PRESSED_STYLE, RADIUS, SPACING } from "../theme";

const JOB_ROLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Android Developer",
  "Data Scientist",
  "MBA/Management"
];

const EXPERIENCE_LEVELS = ["Fresher", "1-2 Years", "3-5 Years"];

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
          {selectedValue || "Select your job role"}
        </Text>
        <AppIcon color={COLORS.accent} name={isOpen ? "up" : "down"} size={20} />
      </HapticPressable>

      {isOpen ? (
        <View style={styles.optionsPanel}>
          <ScrollView nestedScrollEnabled style={styles.optionsScroll}>
            {JOB_ROLES.map((role) => {
              const selected = role === selectedValue;

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
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

export default function ProfileSetupScreen({ navigation, route, onProfileCompleted }) {
  const currentUser = getCurrentUser();
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const [fullName, setFullName] = useState(() => currentUser?.displayName || profile.name || "");
  const [jobRole, setJobRole] = useState(profile.jobRole || "");
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel || "");
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = route?.params?.mode === "edit";

  const canSubmit = useMemo(
    () => Boolean(fullName.trim() && jobRole && experienceLevel && !isSaving),
    [experienceLevel, fullName, isSaving, jobRole]
  );

  const saveProfile = async () => {
    if (!canSubmit) {
      Alert.alert("Complete profile", "Please add your name, role, and experience level.");
      return;
    }

    const user = currentUser || getCurrentUser();

    if (!user) {
      Alert.alert(
        "Login required",
        "Please create an account or login before saving your profile."
      );
      return;
    }

    const profileData = {
      fullName: fullName.trim(),
      name: fullName.trim(),
      jobRole,
      experienceLevel,
      email: user.email || "",
      onboardingCompleted: true,
      updatedAt: serverTimestamp()
    };

    setIsSaving(true);

    try {
      const batch = writeBatch(firestore);

      batch.set(doc(firestore, "users", user.uid, "profile", "main"), profileData, {
        merge: true
      });
      batch.set(
        doc(firestore, "users", user.uid),
        {
          fullName: profileData.fullName,
          name: profileData.name,
          jobRole: profileData.jobRole,
          experienceLevel: profileData.experienceLevel,
          onboardingCompleted: true,
          updatedAt: profileData.updatedAt
        },
        { merge: true }
      );

      await batch.commit();

      updateProfile({
        name: profileData.fullName,
        fullName: profileData.fullName,
        jobRole,
        experienceLevel
      });

      onProfileCompleted?.();
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "MainTabs",
            params: { screen: route?.params?.returnToProfile ? "Profile" : "Home" }
          }
        ]
      });
    } catch (error) {
      Alert.alert("Profile save failed", error.message || "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isEditMode ? (
        <HapticPressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <AppIcon color={COLORS.text} name="back" size={18} />
          <AppText selectable={false} variant="button">
            Back
          </AppText>
        </HapticPressable>
      ) : null}

      <View style={styles.header}>
        <View style={styles.heroIcon}>
          <AppIcon color={COLORS.accent} name="target" size={34} />
        </View>
        <AppText tone="primary" variant="caption">
          Profile setup
        </AppText>
        <AppText variant="screenTitle">Personalize your practice</AppText>
        <AppText tone="muted" variant="body">
          Your role and experience help IntervueAI generate better interview questions.
        </AppText>
      </View>

      <AppCard style={styles.card}>
        <View style={styles.field}>
          <AppInput
            autoCapitalize="words"
            autoComplete="name"
            icon="user"
            label="Full name"
            onChangeText={setFullName}
            placeholder="Enter your full name"
            value={fullName}
          />
        </View>

        <JobRolePicker selectedValue={jobRole} onSelect={setJobRole} />

        <View style={styles.field}>
          <Text selectable style={styles.label}>
            Experience Level
          </Text>
          <View style={styles.segmentRow}>
            {EXPERIENCE_LEVELS.map((level) => {
              const selected = experienceLevel === level;

              return (
                <HapticPressable
                  key={level}
                  onPress={() => setExperienceLevel(level)}
                  style={({ pressed }) => [
                    styles.segmentButton,
                    selected && styles.segmentButtonSelected,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                    {level}
                  </Text>
                </HapticPressable>
              );
            })}
          </View>
        </View>
      </AppCard>

      <AppButton disabled={!canSubmit} loading={isSaving} onPress={saveProfile} rightIcon="next">
        Save profile
      </AppButton>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.xs,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: SPACING.lg
  },
  card: {
    gap: SPACING.xl
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1
  },
  content: {
    flexGrow: 1,
    gap: SPACING.xxl,
    padding: SPACING.screen,
    paddingBottom: 36
  },
  field: {
    gap: SPACING.sm
  },
  header: {
    gap: SPACING.sm,
    paddingTop: 8
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: COLORS.primarySoft,
    borderColor: "rgba(124, 109, 255, 0.35)",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  label: {
    color: COLORS.text,
    fontSize: 15,
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
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: "hidden"
  },
  optionsScroll: {
    maxHeight: 230
  },
  placeholderText: {
    color: COLORS.muted,
    fontWeight: "700"
  },
  pressed: {
    ...PRESSED_STYLE
  },
  segmentButton: {
    alignItems: "center",
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 10
  },
  segmentButtonSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent
  },
  segmentRow: {
    flexDirection: "row",
    gap: 10
  },
  segmentText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  segmentTextSelected: {
    color: COLORS.text
  },
  selectButton: {
    alignItems: "center",
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
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
  }
});
