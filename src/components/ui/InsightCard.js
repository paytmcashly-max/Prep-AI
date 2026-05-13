import AppCard from "./AppCard";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import Inline from "./Inline";
import Stack from "./Stack";
import { useAppTheme } from "../../theme";

export default function InsightCard({ children, icon = "info", message, title, tone = "default" }) {
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
    <AppCard tone="subtle">
      <Inline align="flex-start" gap="md">
        <AppIcon color={iconColor} name={icon} size={20} />
        <Stack gap="xs" style={{ flex: 1 }}>
          <AppText variant="cardTitle">{title}</AppText>
          {message ? (
            <AppText tone="muted" variant="bodyMuted">
              {message}
            </AppText>
          ) : null}
          {children}
        </Stack>
      </Inline>
    </AppCard>
  );
}
