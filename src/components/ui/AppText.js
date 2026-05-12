import { Text } from "react-native";

import { COLORS, TYPOGRAPHY } from "../../theme";

const VARIANTS = {
  body: TYPOGRAPHY.body,
  bodyMuted: TYPOGRAPHY.bodyMuted,
  bodyStrong: TYPOGRAPHY.bodyStrong,
  button: TYPOGRAPHY.button,
  caption: TYPOGRAPHY.caption,
  cardTitle: TYPOGRAPHY.cardTitle,
  display: TYPOGRAPHY.display,
  heroTitle: TYPOGRAPHY.heroTitle,
  monoNumber: TYPOGRAPHY.monoNumber,
  screenTitle: TYPOGRAPHY.screenTitle,
  sectionTitle: TYPOGRAPHY.sectionTitle,
  statNumber: TYPOGRAPHY.statNumber
};

const COLORS_BY_TONE = {
  default: COLORS.text,
  danger: COLORS.danger,
  muted: COLORS.muted,
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  success: COLORS.success,
  warning: COLORS.warning
};

export default function AppText({
  children,
  color,
  numberOfLines,
  selectable = true,
  style,
  tone = "default",
  variant = "body"
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      selectable={selectable}
      style={[
        VARIANTS[variant] || TYPOGRAPHY.body,
        { color: color || COLORS_BY_TONE[tone] },
        style
      ]}
    >
      {children}
    </Text>
  );
}
