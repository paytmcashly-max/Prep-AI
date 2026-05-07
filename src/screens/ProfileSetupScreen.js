import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";

import { getCurrentUser } from "../services/authService";
import { firestore } from "../services/firebaseConfig";
import { useUserStore } from "../store/userStore";

const JOB_ROLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Android Developer",
  "Data Scientist",
  "MBA/Management"
];

const EXPERIENCE_LEVELS = ["Fresher", "1-2 Years", "3-5 Years"];

const COLORS = {
  accent: "#6C63FF",
  background: "#0A0A0A",
  card: "#1A1A1A",
  border: "#2A2A2A",
  muted: "#A3A3A3",
  text: "#FFFFFF"
};

function JobRolePicker({ selectedValue, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.field}>
      <Text selectable style={styles.label}>
        Job Role
      </Text>
      <Pressable
        onPress={() => setIsOpen((current) => !current)}
        style={({ pressed }) => [styles.selectButton, pressed && styles.pressed]}
      >
        <Text style={[styles.selectText, !selectedValue && styles.placeholderText]}>
          {selectedValue || "Select your job role"}
        </Text>
        <Text style={styles.chevron}>{isOpen ? "Up" : "Down"}</Text>
      </Pressable>

      {isOpen ? (
        <View style={styles.optionsPanel}>
          <ScrollView nestedScrollEnabled style={styles.optionsScroll}>
            {JOB_ROLES.map((role) => {
              const selected = role === selectedValue;

              return (
                <Pressable
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
                </Pressable>
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
  const [fullName, setFullName] = useState(
    () => currentUser?.displayName || profile.name || ""
  );
  const [jobRole, setJobRole] = useState(profile.jobRole || "");
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel || "");
  const [isSaving, setIsSaving] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(fullName.trim() && jobRole && experienceLevel && !isSaving),
    [experienceLevel, fullName, isSaving, jobRole]
  );

  useEffect(() => {
    const savedName = currentUser?.displayName || profile.name || "";

    if (!fullName.trim() && savedName) {
      setFullName(savedName);
    }
  }, [currentUser?.displayName, fullName, profile.name]);

  const saveProfile = async () => {
    if (!canSubmit) {
      Alert.alert("Complete profile", "Please add your name, role, and experience level.");
      return;
    }

    const user = currentUser || getCurrentUser();

    if (!user) {
      Alert.alert("Login required", "Please create an account or login before saving your profile.");
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
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onTouchStart={Keyboard.dismiss}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text selectable style={styles.eyebrow}>
            Profile setup
          </Text>
          <Text selectable style={styles.title}>
            Personalize your practice
          </Text>
          <Text selectable style={styles.subtitle}>
            Your role and experience help PrepAI generate better interview questions.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text selectable style={styles.label}>
              Full Name
            </Text>
            <TextInput
              autoCapitalize="words"
              autoComplete="name"
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
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
                  <Pressable
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
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <Pressable
          disabled={!canSubmit}
          onPress={saveProfile}
          style={({ pressed }) => [
            styles.saveButton,
            !canSubmit && styles.saveButtonDisabled,
            pressed && canSubmit && styles.pressed
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 22,
    padding: 18
  },
  chevron: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "900"
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1
  },
  content: {
    flexGrow: 1,
    gap: 24,
    padding: 20,
    paddingBottom: 36
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  field: {
    gap: 10
  },
  header: {
    gap: 10,
    paddingTop: 8
  },
  input: {
    backgroundColor: "#111111",
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: 16
  },
  keyboardView: {
    flex: 1
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
    backgroundColor: "#111111",
    borderColor: COLORS.border,
    borderRadius: 8,
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
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 18
  },
  saveButtonDisabled: {
    opacity: 0.45
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900"
  },
  segmentButton: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: COLORS.border,
    borderRadius: 8,
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
    backgroundColor: "#111111",
    borderColor: COLORS.border,
    borderRadius: 8,
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
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 16,
    lineHeight: 24
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 39
  }
});
