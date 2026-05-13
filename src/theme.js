import { createContext, useContext, useMemo } from "react";
import { Platform, useColorScheme } from "react-native";

export const FONT_FAMILY = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extraBold: "Inter_800ExtraBold",
  black: "Inter_900Black",
  fallback: Platform.select({
    android: "sans-serif",
    ios: "System",
    default: "System"
  }),
  fallbackMedium: Platform.select({
    android: "sans-serif-medium",
    ios: "System",
    default: "System"
  })
};

export const COLORS = {
  background: "#070A13",
  surface: "#0B101B",
  elevated: "#101827",
  card: "rgba(17, 24, 39, 0.9)",
  cardAlt: "rgba(12, 18, 30, 0.92)",
  cardPressed: "rgba(28, 39, 58, 0.94)",
  border: "rgba(169, 190, 255, 0.1)",
  borderStrong: "rgba(169, 190, 255, 0.18)",
  text: "#F3F6FF",
  textSoft: "#D8DFEE",
  muted: "#A7B1C7",
  mutedStrong: "#C0C9D8",
  primary: "#8B80FF",
  primaryStrong: "#A8A0FF",
  accent: "#8B80FF",
  primaryDark: "#5B5BF4",
  primarySoft: "rgba(139, 128, 255, 0.15)",
  secondary: "#62D6FF",
  secondaryStrong: "#7FFFE7",
  secondarySoft: "rgba(98, 214, 255, 0.13)",
  success: "#34D399",
  successSoft: "rgba(52, 211, 153, 0.13)",
  warning: "#FBBF24",
  warningSoft: "rgba(251, 191, 36, 0.14)",
  danger: "#FB7185",
  dangerSoft: "rgba(251, 113, 133, 0.14)",
  info: "#60A5FA",
  infoSoft: "rgba(96, 165, 250, 0.13)",
  green: "#34D399",
  yellow: "#FBBF24",
  red: "#FB7185",
  disabled: "#2A3140",
  disabledText: "#778195",
  overlay: "rgba(8, 10, 16, 0.82)"
};

export const DARK_COLORS = {
  ...COLORS,
  accent: COLORS.primary,
  dangerSoft: COLORS.dangerSoft,
  green: COLORS.success,
  red: COLORS.danger,
  yellow: COLORS.warning
};

export const COLOR_SCHEMES = {
  dark: {
    ...COLORS,
    accent: COLORS.primary
  },
  light: {
    background: "#F6F7FB",
    surface: "#FFFFFF",
    elevated: "#FFFFFF",
    card: "#FFFFFF",
    cardAlt: "#F0F3F9",
    cardPressed: "#EEF2FF",
    border: "#E2E8F0",
    borderStrong: "#CBD5E1",
    text: "#101828",
    textSoft: "#344054",
    muted: "#667085",
    mutedStrong: "#475467",
    primary: "#6258F6",
    primaryDark: "#4338CA",
    primarySoft: "rgba(98, 88, 246, 0.12)",
    secondary: "#0EA5E9",
    secondarySoft: "rgba(14, 165, 233, 0.12)",
    success: "#16A34A",
    successSoft: "rgba(22, 163, 74, 0.12)",
    warning: "#D97706",
    warningSoft: "rgba(217, 119, 6, 0.12)",
    danger: "#DC2626",
    dangerSoft: "rgba(220, 38, 38, 0.1)",
    info: "#2563EB",
    infoSoft: "rgba(37, 99, 235, 0.1)",
    disabled: "#E2E8F0",
    disabledText: "#94A3B8",
    overlay: "rgba(246, 247, 251, 0.82)",
    accent: "#6258F6"
  }
};

const addThemeAliases = (colors) => ({
  ...colors,
  accent: colors.primary,
  destructive: colors.danger,
  destructiveSoft: colors.dangerSoft,
  focusRing: colors.secondarySoft || colors.primarySoft,
  input: colors.cardAlt,
  inputBorder: colors.border,
  primaryTextOnAccent: colors.background,
  row: colors.cardAlt,
  separator: colors.border,
  shadow: "#000000"
});

export const APP_COLOR_SCHEMES = {
  dark: addThemeAliases(COLOR_SCHEMES.dark),
  light: addThemeAliases(COLOR_SCHEMES.light)
};

export const GRADIENTS = {
  app: ["#070A13", "#0B1020", "#070A13"],
  hero: ["rgba(139,128,255,0.22)", "rgba(98,214,255,0.1)", "rgba(7,10,19,0)"],
  primary: ["#8B80FF", "#62D6FF"],
  primaryDeep: ["#5B5BF4", "#62D6FF"],
  calm: ["rgba(139,128,255,0.18)", "rgba(98,214,255,0.08)"],
  premium: ["rgba(139,128,255,0.28)", "rgba(127,255,231,0.1)"],
  score: ["#7FFFE7", "#8B80FF"]
};

export const APP_GRADIENTS = {
  dark: GRADIENTS,
  light: {
    app: ["#F6F7FB", "#EEF4FF", "#F6F7FB"],
    hero: ["rgba(98,88,246,0.12)", "rgba(14,165,233,0.08)", "rgba(246,247,251,0)"],
    primary: ["#6258F6", "#0EA5E9"],
    primaryDeep: ["#4338CA", "#0EA5E9"],
    calm: ["rgba(98,88,246,0.12)", "rgba(14,165,233,0.08)"],
    premium: ["rgba(98,88,246,0.16)", "rgba(14,165,233,0.09)"],
    score: ["#0EA5E9", "#6258F6"]
  }
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  screen: 16,
  card: 16,
  section: 20
};

export const RADIUS = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999
};

export const TYPOGRAPHY = {
  display: {
    fontFamily: FONT_FAMILY.black,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
    lineHeight: 38
  },
  heroTitle: {
    fontFamily: FONT_FAMILY.black,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 35
  },
  screenTitle: {
    fontFamily: FONT_FAMILY.extraBold,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.2,
    lineHeight: 31
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21
  },
  body: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20
  },
  bodyStrong: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20
  },
  bodyMuted: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 19
  },
  caption: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 15
  },
  button: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19
  },
  statNumber: {
    fontFamily: FONT_FAMILY.black,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 31
  },
  monoNumber: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 20
  },
  title: {
    fontFamily: FONT_FAMILY.extraBold,
    fontSize: 27,
    fontWeight: "800",
    lineHeight: 34
  }
};

export const ICON_SIZES = {
  tab: 23,
  row: 21,
  card: 30,
  hero: 46
};

export const SHADOWS = {
  card: {
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 18
  },
  glow: {
    elevation: 6,
    shadowColor: "#62D6FF",
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 28
  },
  none: {
    elevation: 0,
    shadowOpacity: 0
  }
};

export const PRESSED_STYLE = {
  opacity: 0.88,
  transform: [{ scale: 0.985 }]
};

const ThemeContext = createContext({
  colorScheme: "dark",
  colors: APP_COLOR_SCHEMES.dark,
  gradients: APP_GRADIENTS.dark
});

export function AppThemeProvider({ children }) {
  const deviceScheme = useColorScheme();
  const colorScheme = deviceScheme === "light" ? "light" : "dark";
  const value = useMemo(
    () => ({
      colorScheme,
      colors: APP_COLOR_SCHEMES[colorScheme],
      gradients: APP_GRADIENTS[colorScheme]
    }),
    [colorScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => useContext(ThemeContext);

export const createScreenContentStyle = (topInset = 0, bottomInset = 0) => ({
  gap: SPACING.lg,
  paddingHorizontal: SPACING.screen,
  paddingTop: Math.max(topInset + 2, 10),
  paddingBottom: Math.max(bottomInset + 82, 92)
});

export const getThemeColors = (colorScheme) =>
  colorScheme === "light" ? APP_COLOR_SCHEMES.light : APP_COLOR_SCHEMES.dark;
