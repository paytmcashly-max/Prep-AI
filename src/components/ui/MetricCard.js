import AppCard from "./AppCard";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import Inline from "./Inline";
import Stack from "./Stack";
import { useAppTheme } from "../../theme";

export default function MetricCard({
  compact = false,
  helper,
  icon,
  label,
  style,
  tone = "default",
  value
}) {
  const { colors } = useAppTheme();
  const iconColor =
    tone === "success"
      ? colors.success
      : tone === "warning"
        ? colors.warning
        : tone === "danger"
          ? colors.danger
          : colors.secondary;

  return (
    <AppCard style={[{ flex: 1, minWidth: compact ? 0 : 104 }, style]}>
      <Stack gap="xs">
        <Inline justify="space-between">
          <AppText tone="muted" variant="caption">
            {label}
          </AppText>
          {icon ? <AppIcon color={iconColor} name={icon} size={compact ? 16 : 18} /> : null}
        </Inline>
        <AppText color={iconColor} variant={compact ? "sectionTitle" : "statNumber"}>
          {value}
        </AppText>
        {!compact && helper ? (
          <AppText tone="muted" variant="bodyMuted">
            {helper}
          </AppText>
        ) : null}
      </Stack>
    </AppCard>
  );
}
