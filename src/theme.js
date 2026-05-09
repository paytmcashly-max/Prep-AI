export const COLORS = {
  accent: "#6C63FF",
  background: "#0A0A0A",
  border: "#2A2A2A",
  card: "#1A1A1A",
  cardAlt: "#111111",
  danger: "#EF4444",
  dangerSoft: "#FCA5A5",
  muted: "#A3A3A3",
  primary: "#6C63FF",
  primaryDark: "#4F46E5",
  surface: "#111111",
  success: "#22C55E",
  text: "#FFFFFF",
  warning: "#FACC15"
};

export const DARK_COLORS = {
  ...COLORS,
  green: COLORS.success,
  red: COLORS.danger,
  yellow: COLORS.warning
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  base: 12,
  md: 16,
  card: 18,
  lg: 24,
  xl: 32,
  screen: 20
};

export const RADIUS = {
  sm: 8,
  md: 10,
  lg: 12,
  pill: 999
};

export const TYPOGRAPHY = {
  caption: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16
  },
  body: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 38
  }
};

export const ICON_SIZES = {
  tab: 23,
  row: 21,
  card: 28,
  hero: 44
};

export const SHADOWS = {
  card: {
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { height: 6, width: 0 }
  }
};

export const PRESSED_STYLE = {
  opacity: 0.82,
  transform: [{ scale: 0.99 }]
};
