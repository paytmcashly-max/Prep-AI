import AppCard from "./AppCard";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import Badge from "./Badge";
import BrandMark from "./BrandMark";
import Inline from "./Inline";
import Stack from "./Stack";
import { SPACING, useAppTheme } from "../../theme";

export default function ScreenHero({
  badge,
  badgeIcon = "sparkles",
  children,
  icon,
  logo,
  subtitle,
  title
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard gradient="calm" style={{ gap: SPACING.sm, overflow: "hidden", padding: 13 }}>
      <Inline align="flex-start" gap="sm">
        {logo ? (
          <BrandMark size="lg" />
        ) : icon ? (
          <Inline
            align="center"
            justify="center"
            style={{
              backgroundColor: colors.secondarySoft,
              borderColor: colors.border,
              borderRadius: 18,
              borderWidth: 1,
              height: 50,
              width: 50
            }}
          >
            <AppIcon color={colors.secondary} name={icon} size={22} />
          </Inline>
        ) : null}
        <Stack gap="sm" style={{ flex: 1 }}>
          {badge ? <Badge icon={badgeIcon} label={badge} /> : null}
          <AppText variant="screenTitle">{title}</AppText>
        </Stack>
      </Inline>
      {subtitle ? (
        <AppText tone="muted" variant="body">
          {subtitle}
        </AppText>
      ) : null}
      {children}
    </AppCard>
  );
}
