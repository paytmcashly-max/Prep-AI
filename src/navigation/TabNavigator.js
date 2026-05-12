import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";

import AppIcon from "../components/ui/AppIcon";
import HomeScreen from "../screens/HomeScreen";
import PracticeScreen from "../screens/PracticeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ResumeScreen from "../screens/ResumeScreen";
import { COLORS, ICON_SIZES, RADIUS } from "../theme";

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
        tabBarActiveTintColor: COLORS.text,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarIcon: ({ color, focused, size }) => (
          <AppIcon
            color={focused ? COLORS.primary : color}
            name={TAB_ICONS[route.name] || "info"}
            size={Math.min(size || ICON_SIZES.tab, 24)}
            strokeWidth={focused ? 2.7 : 2.2}
          />
        ),
        tabBarItemStyle: {
          borderRadius: RADIUS.md,
          marginVertical: 6
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700"
        },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 68,
          paddingBottom: 8,
          paddingHorizontal: 8,
          paddingTop: 6
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
