import AppCard from "./AppCard";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import Inline from "./Inline";
import Stack from "./Stack";
import { useAppTheme } from "../../theme";

export default function MetricCard({ helper, icon, label, tone = "default", value }) {
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
    <AppCard style={{ flex: 1, minWidth: 104 }}>
      <Stack gap="xs">
        <Inline justify="space-between">
          <AppText tone="muted" variant="caption">
            {label}
          </AppText>
          {icon ? <AppIcon color={iconColor} name={icon} size={18} /> : null}
        </Inline>
        <AppText color={iconColor} variant="statNumber">
          {value}
        </AppText>
        {helper ? (
          <AppText tone="muted" variant="bodyMuted">
            {helper}
          </AppText>
        ) : null}
      </Stack>
    </AppCard>
  );
}
