import AppCard from "./AppCard";
import AppButton from "./AppButton";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import Badge from "./Badge";
import Inline from "./Inline";
import Stack from "./Stack";
import { useAppTheme } from "../../theme";

export default function PlanCard({
  badge,
  cta,
  disabled,
  features = [],
  icon = "premium",
  meta,
  loading,
  onPress,
  price,
  subtitle,
  title
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard gradient={badge ? "premium" : undefined} tone={badge ? "accent" : "default"}>
      <Stack gap="md">
        <Inline justify="space-between">
          <Inline align="flex-start" gap="sm" style={{ flex: 1 }}>
            <Inline
              align="center"
              justify="center"
              style={{
                backgroundColor: badge ? colors.primarySoft : colors.secondarySoft,
                borderColor: colors.border,
                borderRadius: 14,
                borderWidth: 1,
                height: 40,
                width: 40
              }}
            >
              <AppIcon color={badge ? colors.primary : colors.secondary} name={icon} size={18} />
            </Inline>
            <Stack gap="xs" style={{ flex: 1 }}>
              <AppText variant="cardTitle">{title}</AppText>
              {subtitle ? (
                <AppText tone="muted" variant="bodyMuted">
                  {subtitle}
                </AppText>
              ) : null}
            </Stack>
          </Inline>
          {badge ? <Badge label={badge} /> : null}
        </Inline>
        <Stack gap="xs">
          <AppText variant="screenTitle">{price}</AppText>
          {meta ? (
            <AppText tone="muted" variant="bodyMuted">
              {meta}
            </AppText>
          ) : null}
        </Stack>
        {features.length ? (
          <Stack gap="xs">
            {features.map((feature) => (
              <Inline align="flex-start" gap="xs" key={feature}>
                <AppIcon color={badge ? colors.primary : colors.success} name="check" size={15} />
                <AppText style={{ flex: 1 }} tone="muted" variant="bodyMuted">
                  {feature}
                </AppText>
              </Inline>
            ))}
          </Stack>
        ) : null}
        {cta ? (
          <AppButton disabled={disabled} loading={loading} onPress={onPress}>
            {cta}
          </AppButton>
        ) : null}
      </Stack>
    </AppCard>
  );
}
