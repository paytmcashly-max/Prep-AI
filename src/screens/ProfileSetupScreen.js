import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";

import HapticPressable from "../components/HapticPressable";
import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppInput from "../components/ui/AppInput";
import AppText from "../components/ui/AppText";
import IconButton from "../components/ui/IconButton";
import JobRolePicker from "../components/ui/JobRolePicker";
import ScreenHero from "../components/ui/ScreenHero";
import { getCurrentUser } from "../services/authService";
import { firestore } from "../services/firebaseConfig";
import { useUserStore } from "../store/userStore";
import { PRESSED_STYLE, RADIUS, SPACING, useAppTheme } from "../theme";

const EXPERIENCE_LEVELS = ["Fresher", "1-2 Years", "3-5 Years"];

export default function ProfileSetupScreen({ navigation, route, onProfileCompleted }) {
  const { colors } = useAppTheme();
  const currentUser = getCurrentUser();
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const suggestedFullName =
    profile.fullName?.trim() || profile.name?.trim() || currentUser?.displayName?.trim() || "";
  const [fullName, setFullName] = useState(suggestedFullName);
  const [hasEditedName, setHasEditedName] = useState(false);
  const [jobRole, setJobRole] = useState(profile.jobRole || "");
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel || "");
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = route?.params?.mode === "edit";

  const canSubmit = useMemo(
    () => Boolean(fullName.trim() && jobRole && experienceLevel && !isSaving),
    [experienceLevel, fullName, isSaving, jobRole]
  );

  useEffect(() => {
    if (!hasEditedName && !fullName.trim() && suggestedFullName) {
      setFullName(suggestedFullName);
    }
  }, [fullName, hasEditedName, suggestedFullName]);

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
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {isEditMode ? (
        <IconButton
          accessibilityLabel="Go back"
          icon="back"
          onPress={() => navigation.goBack()}
          size={44}
          style={styles.backButton}
        />
      ) : null}

      <ScreenHero
        badge="Profile setup"
        badgeIcon="user"
        logo
        title="Personalize your practice"
        subtitle="Your role and experience help IntervueAI generate better interview questions."
      />

      <AppCard style={styles.card}>
        <View style={styles.field}>
          <AppInput
            autoCapitalize="words"
            autoComplete="name"
            icon="user"
            label="Full name"
            onChangeText={(value) => {
              setHasEditedName(true);
              setFullName(value);
            }}
            placeholder="Enter your full name"
            value={fullName}
          />
        </View>

        <JobRolePicker selectedValue={jobRole} onSelect={setJobRole} />

        <View style={styles.field}>
          <AppText variant="bodyStrong">Experience Level</AppText>
          <View style={styles.segmentRow}>
            {EXPERIENCE_LEVELS.map((level) => {
              const selected = experienceLevel === level;

              return (
                <HapticPressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={level}
                  onPress={() => setExperienceLevel(level)}
                  style={({ pressed }) => [
                    styles.segmentButton,
                    {
                      backgroundColor: selected ? colors.primarySoft : colors.cardAlt,
                      borderColor: selected ? colors.primary : colors.border
                    },
                    pressed && styles.pressed
                  ]}
                >
                  <AppText
                    color={selected ? colors.primary : colors.text}
                    selectable={false}
                    variant="bodyStrong"
                  >
                    {level}
                  </AppText>
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
    alignSelf: "flex-start",
    marginBottom: -SPACING.sm
  },
  card: {
    gap: SPACING.xl
  },
  container: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    gap: SPACING.xl,
    padding: SPACING.screen,
    paddingBottom: 28
  },
  field: {
    gap: SPACING.sm
  },
  pressed: {
    ...PRESSED_STYLE
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 10
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
});
