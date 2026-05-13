import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Platform, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppIcon from "../components/ui/AppIcon";
import HomeScreen from "../screens/HomeScreen";
import PracticeScreen from "../screens/PracticeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ResumeScreen from "../screens/ResumeScreen";
import { ICON_SIZES, RADIUS, SPACING, useAppTheme } from "../theme";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: "home",
  Practice: "practice",
  Profile: "profile",
  Progress: "chart",
  Resume: "resume"
};

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const floatingBottom = Math.max(insets.bottom + 6, 10);
  const tabBarWidth = Math.min(width - SPACING.lg * 2, 430);
  const iconPillActiveStyle = {
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    shadowColor: colors.primary,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      sceneContainerStyle={{
        backgroundColor: "transparent"
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveBackgroundColor: "transparent",
        tabBarActiveTintColor: colors.secondary,
        tabBarHideOnKeyboard: true,
        tabBarInactiveBackgroundColor: "transparent",
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, focused, size }) => {
          const iconColor = focused ? colors.primary : color;

          return (
            <View style={[styles.iconPill, focused && iconPillActiveStyle]}>
              <AppIcon
                color={iconColor}
                name={TAB_ICONS[route.name] || "info"}
                size={Math.min(size || ICON_SIZES.tab, focused ? 22 : 21)}
                strokeWidth={focused ? 2.6 : 2.15}
              />
            </View>
          );
        },
        tabBarIconStyle: {
          alignItems: "center",
          height: 32,
          justifyContent: "center",
          marginTop: 0,
          width: 46
        },
        tabBarItemStyle: {
          alignItems: "center",
          borderRadius: RADIUS.pill,
          justifyContent: "center",
          marginHorizontal: 1,
          marginVertical: 6,
          minHeight: 50,
          paddingTop: 0
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_700Bold",
          fontWeight: "800",
          lineHeight: 13,
          paddingBottom: 3
        },
        tabBarStyle: {
          position: "absolute",
          bottom: floatingBottom,
          left: Math.max((width - tabBarWidth) / 2, SPACING.lg),
          alignSelf: "center",
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: 32,
          borderTopColor: colors.border,
          borderWidth: 1,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 5,
          paddingHorizontal: 7,
          paddingTop: 5,
          shadowColor: "#000000",
          shadowOffset: { height: 14, width: 0 },
          shadowOpacity: 0.18,
          shadowRadius: 18,
          elevation: Platform.OS === "android" ? 8 : 0,
          overflow: Platform.OS === "android" ? "hidden" : "visible",
          width: tabBarWidth
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

const styles = {
  iconPill: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 28,
    borderRadius: RADIUS.pill
  }
};
