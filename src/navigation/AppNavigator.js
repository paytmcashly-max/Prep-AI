import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { auth, firestore } from "../services/firebaseConfig";
import { consumeLastAuthAction } from "../services/authService";
import LoginScreen from "../screens/LoginScreen";
import MockInterviewScreen from "../screens/MockInterviewScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import PaywallScreen from "../screens/PaywallScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import SignupScreen from "../screens/SignupScreen";
import SplashScreen from "../screens/SplashScreen";
import { useProgressStore } from "../store/progressStore";
import { useUserStore } from "../store/userStore";
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerBackTitleVisible: false,
  headerShadowVisible: false,
  headerShown: false,
  contentStyle: { backgroundColor: "#F8FAFC" }
};

function AuthStack({ initialRouteName = "Splash" }) {
  return (
    <Stack.Navigator
      key={initialRouteName}
      initialRouteName={initialRouteName}
      screenOptions={screenOptions}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AppStack({ hasCompletedProfile, onProfileCompleted }) {
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

export default function AppNavigator() {
  const setUser = useUserStore((state) => state.setUser);
  const resetUser = useUserStore((state) => state.resetUser);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const [authInitialRoute, setAuthInitialRoute] = useState("Splash");
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);

  useEffect(() => {
    let unsubscribeProfile = null;

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

        setAuthInitialRoute(authAction === "logout" ? "Login" : "Splash");
        resetUser();
        resetProgress();
        setProfileLoading(false);
        setAuthLoading(false);
        return;
      }

      const authAction = consumeLastAuthAction();

      setAuthLoading(false);
      setProfileLoading(false);

      if (authAction === "login") {
        setHasCompletedProfile(true);
      } else if (authAction === "signup") {
        setHasCompletedProfile(false);
      } else {
        setHasCompletedProfile(true);
      }

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

          const completed =
            authAction === "login"
              ? true
              : profile
                ? Boolean(profile.onboardingCompleted)
                : authAction !== "signup";

          if (profile) {
            updateProfile({
              name: profile.fullName || profile.name || user.displayName || "",
              fullName: profile.fullName || profile.name || user.displayName || "",
              jobRole: profile.jobRole || "",
              experienceLevel: profile.experienceLevel || "",
              targetCompanies: profile.targetCompanies || []
            });
          }

          setHasCompletedProfile((current) => current || completed);
        },
        () => {
          setHasCompletedProfile(authAction === "login");
        }
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [resetProgress, resetUser, setUser, updateProfile]);

  if (authLoading || (currentUser && profileLoading)) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {currentUser ? (
        <AppStack
          hasCompletedProfile={hasCompletedProfile}
          onProfileCompleted={() => setHasCompletedProfile(true)}
        />
      ) : (
        <AuthStack initialRouteName={authInitialRoute} />
      )}
    </NavigationContainer>
  );
}
