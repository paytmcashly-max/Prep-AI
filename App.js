import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { StatusBar } from "expo-status-bar";
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
import { COLORS } from "./src/theme";

initializeErrorTracking();
initializeAnalytics();

function App() {
  const hasStartedUpdateCheckRef = useRef(false);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black
  });

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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar backgroundColor={COLORS.background} style="light" translucent={false} />
        <SafeAreaView edges={["top"]} style={{ backgroundColor: COLORS.background, flex: 1 }}>
          <AppNavigator />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default withErrorTracking(App);
