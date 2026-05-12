import { Platform } from "react-native";

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
  background: "#080A10",
  surface: "#0D1018",
  elevated: "#111622",
  card: "#151B28",
  cardAlt: "#101522",
  cardPressed: "#1A2231",
  border: "rgba(255, 255, 255, 0.1)",
  borderStrong: "rgba(255, 255, 255, 0.16)",
  text: "#F8FAFC",
  textSoft: "#D7DEEA",
  muted: "#98A2B3",
  mutedStrong: "#B7C0CF",
  primary: "#7C6DFF",
  accent: "#7C6DFF",
  primaryDark: "#5A4CF0",
  primarySoft: "rgba(124, 109, 255, 0.15)",
  secondary: "#38BDF8",
  secondarySoft: "rgba(56, 189, 248, 0.13)",
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
  dangerSoft: "#FDA4AF",
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

export const GRADIENTS = {
  app: ["#080A10", "#0D1020", "#080A10"],
  hero: ["rgba(124,109,255,0.26)", "rgba(56,189,248,0.09)", "rgba(8,10,16,0)"],
  primary: ["#8B7CFF", "#635BFF"],
  calm: ["rgba(124,109,255,0.18)", "rgba(52,211,153,0.09)"],
  premium: ["rgba(124,109,255,0.28)", "rgba(251,191,36,0.1)"],
  score: ["#34D399", "#7C6DFF"]
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screen: 20,
  card: 20,
  section: 26
};

export const RADIUS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999
};

export const TYPOGRAPHY = {
  display: {
    fontFamily: FONT_FAMILY.black,
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -0.4,
    lineHeight: 45
  },
  heroTitle: {
    fontFamily: FONT_FAMILY.black,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 41
  },
  screenTitle: {
    fontFamily: FONT_FAMILY.extraBold,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.2,
    lineHeight: 38
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 25
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23
  },
  body: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22
  },
  bodyStrong: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22
  },
  bodyMuted: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 21
  },
  caption: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 16
  },
  button: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20
  },
  statNumber: {
    fontFamily: FONT_FAMILY.black,
    fontSize: 34,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 40
  },
  monoNumber: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 22
  },
  title: {
    fontFamily: FONT_FAMILY.extraBold,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 38
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
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 18
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

export const createScreenContentStyle = (bottomInset = 0) => ({
  gap: SPACING.section,
  padding: SPACING.screen,
  paddingBottom: Math.max(bottomInset + SPACING.xxl, 40)
});

export const getThemeColors = (colorScheme) =>
  colorScheme === "light" ? COLOR_SCHEMES.light : COLOR_SCHEMES.dark;
