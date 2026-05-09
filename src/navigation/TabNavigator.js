import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import HomeScreen from "../screens/HomeScreen";
import PracticeScreen from "../screens/PracticeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ResumeScreen from "../screens/ResumeScreen";
import { DARK_COLORS } from "../theme";

const COLORS = DARK_COLORS;

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: "home",
  Practice: "mic",
  Resume: "document-text",
  Progress: "bar-chart",
  Profile: "person"
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
          <Ionicons color={color} name={TAB_ICONS[route.name] || "ellipse"} size={size} />
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
