import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";

import AppIcon from "../components/ui/AppIcon";
import HomeScreen from "../screens/HomeScreen";
import PracticeScreen from "../screens/PracticeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ResumeScreen from "../screens/ResumeScreen";
import { COLORS, ICON_SIZES, RADIUS, SPACING } from "../theme";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: "home",
  Practice: "practice",
  Profile: "profile",
  Progress: "progress",
  Resume: "resume"
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
        tabBarActiveBackgroundColor: "rgba(124, 109, 255, 0.14)",
        tabBarActiveTintColor: COLORS.text,
        tabBarHideOnKeyboard: true,
        tabBarInactiveBackgroundColor: "transparent",
        tabBarInactiveTintColor: COLORS.muted,
        tabBarIcon: ({ color, focused, size }) => (
          <AppIcon
            color={focused ? COLORS.primary : color}
            name={TAB_ICONS[route.name] || "info"}
            size={Math.min(size || ICON_SIZES.tab, focused ? 24 : 23)}
            strokeWidth={focused ? 2.55 : 2.15}
          />
        ),
        tabBarIconStyle: {
          marginTop: 3
        },
        tabBarItemStyle: {
          borderRadius: RADIUS.lg,
          marginHorizontal: 2,
          marginVertical: 7,
          minHeight: 54
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "800",
          lineHeight: 14,
          paddingBottom: 2
        },
        tabBarStyle: {
          backgroundColor: "rgba(13, 16, 24, 0.98)",
          borderColor: COLORS.border,
          borderRadius: RADIUS.xl,
          borderTopColor: COLORS.border,
          borderWidth: 1,
          height: 78,
          marginHorizontal: SPACING.md,
          paddingBottom: 9,
          paddingHorizontal: 7,
          paddingTop: 7
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
