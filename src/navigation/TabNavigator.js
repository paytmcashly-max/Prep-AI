import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";

import AppIcon from "../components/ui/AppIcon";
import HomeScreen from "../screens/HomeScreen";
import PracticeScreen from "../screens/PracticeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ResumeScreen from "../screens/ResumeScreen";
import { COLORS, ICON_SIZES } from "../theme";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: "home",
  Practice: "practice",
  Resume: "resume",
  Progress: "progress",
  Profile: "profile"
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        headerShadowVisible: false,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarIcon: ({ color, size }) => (
          <AppIcon
            color={color}
            name={TAB_ICONS[route.name] || "info"}
            size={Math.min(size || ICON_SIZES.tab, 24)}
          />
        ),
        tabBarStyle: {
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.background
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Practice" component={PracticeScreen} />
      <Tab.Screen name="Resume" component={ResumeScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
