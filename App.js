import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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

initializeErrorTracking();
initializeAnalytics();

function App() {
  useEffect(() => {
    trackEvent("app_opened");

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        identifyUser(user.uid);
        setupNotifications(user);
      } else {
        resetAnalytics();
      }
    });

    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

export default withErrorTracking(App);
