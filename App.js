import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { StatusBar } from "expo-status-bar";
import * as ExpoSplashScreen from "expo-splash-screen";
import { ImageBackground, StyleSheet, View, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts
} from "@expo-google-fonts/inter";

import { auth } from "./src/services/firebaseConfig";
import AppNavigator from "./src/navigation/AppNavigator";
import {
  identifyUser,
  initializeAnalytics,
  resetAnalytics,
  trackEvent
} from "./src/services/analyticsService";
import { initializeErrorTracking, withErrorTracking } from "./src/services/errorTrackingService";
import { setupNotifications } from "./src/services/notificationService";
import { checkForAppUpdate } from "./src/services/updateService";
import { useSubscriptionStore } from "./src/store/subscriptionStore";
import { AppThemeProvider, useAppTheme } from "./src/theme";

initializeErrorTracking();
initializeAnalytics();
void ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

const launchSplashLight = require("./assets/launch-splash-light.png");
const launchSplashDark = require("./assets/launch-splash-dark.png");
const MIN_LAUNCH_SCREEN_MS = 1100;

function LaunchScreen() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.launchScreen}>
      <ImageBackground
        source={colorScheme === "dark" ? launchSplashDark : launchSplashLight}
        resizeMode="cover"
        style={styles.launchImage}
      />
    </View>
  );
}

function AppShell() {
  const { colorScheme, colors } = useAppTheme();

  return (
    <>
      <StatusBar
        backgroundColor={colors.background}
        style={colorScheme === "light" ? "dark" : "light"}
        translucent={false}
      />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
        <AppNavigator />
      </SafeAreaView>
    </>
  );
}

function App() {
  const hasStartedUpdateCheckRef = useRef(false);
  const hasHiddenNativeSplashRef = useRef(false);
  const launchStartedAtRef = useRef(Date.now());
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black
  });
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);

  useEffect(() => {
    trackEvent("app_opened");

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        identifyUser(user.uid);
        setupNotifications(user);
        useSubscriptionStore
          .getState()
          .identifySubscriptionUser(user.uid)
          .catch(() => {});
      } else {
        resetAnalytics();
        useSubscriptionStore.getState().resetSubscription();
      }

      if (!hasStartedUpdateCheckRef.current) {
        hasStartedUpdateCheckRef.current = true;
        checkForAppUpdate();
      }
    });

    return unsubscribe;
  }, []);

  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (!fontsReady) {
      return;
    }

    let cancelled = false;
    const runLaunchSequence = async () => {
      if (!hasHiddenNativeSplashRef.current) {
        hasHiddenNativeSplashRef.current = true;
        await ExpoSplashScreen.hideAsync().catch(() => {});
      }

      const remainingDelay = Math.max(
        0,
        MIN_LAUNCH_SCREEN_MS - (Date.now() - launchStartedAtRef.current)
      );

      const timeout = setTimeout(() => {
        if (!cancelled) {
          setShowLaunchScreen(false);
        }
      }, remainingDelay);

      return () => clearTimeout(timeout);
    };

    let cleanup;
    runLaunchSequence().then((result) => {
      cleanup = result;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [fontsReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {fontsReady ? (
        <SafeAreaProvider>
          {showLaunchScreen ? (
            <LaunchScreen />
          ) : (
            <AppThemeProvider>
              <AppShell />
            </AppThemeProvider>
          )}
        </SafeAreaProvider>
      ) : null}
    </GestureHandlerRootView>
  );
}

export default withErrorTracking(App);

const styles = StyleSheet.create({
  launchScreen: {
    flex: 1,
    backgroundColor: "#F6F7FB"
  },
  launchImage: {
    flex: 1
  }
});
