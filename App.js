import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { auth } from "./src/services/firebaseConfig";
import AppNavigator from "./src/navigation/AppNavigator";
import { setupNotifications } from "./src/services/notificationService";

export default function App() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setupNotifications(user);
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
