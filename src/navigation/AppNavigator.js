import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { doc, getDoc, getDocFromCache, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { auth, firestore } from "../services/firebaseConfig";
import { consumeLastAuthAction, isUserVerifiedForApp } from "../services/authService";
import LoginScreen from "../screens/LoginScreen";
import MockInterviewScreen from "../screens/MockInterviewScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import PaywallScreen from "../screens/PaywallScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import SignupScreen from "../screens/SignupScreen";
import VerifyEmailScreen from "../screens/VerifyEmailScreen";
import { useProgressStore } from "../store/progressStore";
import { useUserStore } from "../store/userStore";
import { useAppTheme } from "../theme";
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator();

function AuthStack({ initialRouteName = "Onboarding", screenOptions }) {
  return (
    <Stack.Navigator
      key={initialRouteName}
      initialRouteName={initialRouteName}
      screenOptions={screenOptions}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AppStack({ hasCompletedProfile, onProfileCompleted, screenOptions }) {
  return (
    <Stack.Navigator
      key={hasCompletedProfile ? "profile-complete" : "profile-required"}
      initialRouteName={hasCompletedProfile ? "MainTabs" : "ProfileSetup"}
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name="ProfileSetup"
        options={({ route }) => ({ headerBackVisible: route.params?.mode === "edit" })}
      >
        {(props) => <ProfileSetupScreen {...props} onProfileCompleted={onProfileCompleted} />}
      </Stack.Screen>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="MockInterview" component={MockInterviewScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: "modal" }} />
    </Stack.Navigator>
  );
}

function VerificationStack({ onVerified, screenOptions }) {
  return (
    <Stack.Navigator initialRouteName="VerifyEmail" screenOptions={screenOptions}>
      <Stack.Screen name="VerifyEmail">
        {(props) => <VerifyEmailScreen {...props} onVerified={onVerified} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const isProfileComplete = (profile) =>
  Boolean(
    profile?.onboardingCompleted === true &&
    (profile.fullName || profile.name) &&
    profile.jobRole &&
    profile.experienceLevel
  );

const isLocalProfileComplete = (profile) =>
  Boolean((profile?.fullName || profile?.name) && profile?.jobRole && profile?.experienceLevel);

export default function AppNavigator() {
  const { colors } = useAppTheme();
  const setUser = useUserStore((state) => state.setUser);
  const resetUser = useUserStore((state) => state.resetUser);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const [authInitialRoute, setAuthInitialRoute] = useState("Onboarding");
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const screenOptions = {
    headerBackTitleVisible: false,
    headerShadowVisible: false,
    headerShown: false,
    contentStyle: { backgroundColor: colors.background }
  };

  const renderLoadingGate = () => (
    <View
      style={{
        alignItems: "center",
        backgroundColor: colors.background,
        flex: 1,
        justifyContent: "center"
      }}
    >
      <ActivityIndicator color={colors.primary} size="small" />
    </View>
  );

  useEffect(() => {
    let unsubscribeProfile = null;

    const getProfileFromCache = async (userId) => {
      try {
        const cachedProfile = await getDocFromCache(
          doc(firestore, "users", userId, "profile", "main")
        );

        if (cachedProfile.exists()) {
          return cachedProfile.data();
        }
      } catch {
        // Cache miss is okay here.
      }

      try {
        const cachedRootProfile = await getDocFromCache(doc(firestore, "users", userId));

        return cachedRootProfile.exists() ? cachedRootProfile.data() : null;
      } catch {
        return null;
      }
    };

    const handleProfileLoadError = async (user) => {
      const cachedProfile = await getProfileFromCache(user.uid);
      const localProfile = useUserStore.getState().profile;
      const nextProfile =
        cachedProfile || (isLocalProfileComplete(localProfile) ? localProfile : null);

      if (nextProfile) {
        updateProfile({
          name: nextProfile.fullName || nextProfile.name || user.displayName || "",
          fullName: nextProfile.fullName || nextProfile.name || user.displayName || "",
          jobRole: nextProfile.jobRole || "",
          experienceLevel: nextProfile.experienceLevel || "",
          targetCompanies: nextProfile.targetCompanies || []
        });
      }

      setHasCompletedProfile(
        isProfileComplete(nextProfile) || (!cachedProfile && isLocalProfileComplete(localProfile))
      );
      setProfileLoading(false);
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setCurrentUser(user);
      setUser(user);
      setHasCompletedProfile(false);

      if (!user) {
        const authAction = consumeLastAuthAction();

        setAuthInitialRoute(authAction === "logout" ? "Login" : "Onboarding");
        resetUser();
        resetProgress();
        setEmailVerified(false);
        setProfileLoading(false);
        setAuthLoading(false);
        return;
      }

      const isVerified = isUserVerifiedForApp(user);
      setEmailVerified(isVerified);
      setAuthLoading(false);

      if (!isVerified) {
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      unsubscribeProfile = onSnapshot(
        doc(firestore, "users", user.uid, "profile", "main"),
        async (snapshot) => {
          let profile = snapshot.exists() ? snapshot.data() : null;

          if (!profile) {
            try {
              const rootSnapshot = await getDoc(doc(firestore, "users", user.uid));
              profile = rootSnapshot.exists() ? rootSnapshot.data() : null;
            } catch {
              profile = null;
            }
          }

          const completed = isProfileComplete(profile);

          if (profile) {
            updateProfile({
              name: profile.fullName || profile.name || user.displayName || "",
              fullName: profile.fullName || profile.name || user.displayName || "",
              jobRole: profile.jobRole || "",
              experienceLevel: profile.experienceLevel || "",
              targetCompanies: profile.targetCompanies || []
            });
          }

          setHasCompletedProfile(completed);
          setProfileLoading(false);
        },
        () => {
          handleProfileLoadError(user).catch(() => {
            setHasCompletedProfile(false);
            setProfileLoading(false);
          });
        }
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [emailVerified, resetProgress, resetUser, setUser, updateProfile]);

  if (authLoading || (currentUser && emailVerified && profileLoading)) {
    return renderLoadingGate();
  }

  return (
    <NavigationContainer>
      {currentUser ? (
        emailVerified ? (
          <AppStack
            hasCompletedProfile={hasCompletedProfile}
            onProfileCompleted={() => setHasCompletedProfile(true)}
            screenOptions={screenOptions}
          />
        ) : (
          <VerificationStack
            onVerified={() => setEmailVerified(true)}
            screenOptions={screenOptions}
          />
        )
      ) : (
        <AuthStack initialRouteName={authInitialRoute} screenOptions={screenOptions} />
      )}
    </NavigationContainer>
  );
}
