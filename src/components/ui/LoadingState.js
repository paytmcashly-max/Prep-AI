import { ActivityIndicator } from "react-native";

import AppCard from "./AppCard";
import AppText from "./AppText";
import Stack from "./Stack";
import { useAppTheme } from "../../theme";

export default function LoadingState({ message = "Loading...", title }) {
  const { colors } = useAppTheme();

  return (
    <AppCard tone="subtle">
      <Stack align="center" gap="sm">
        <ActivityIndicator color={colors.secondary} />
        {title ? <AppText variant="cardTitle">{title}</AppText> : null}
        <AppText style={{ textAlign: "center" }} tone="muted" variant="bodyMuted">
          {message}
        </AppText>
      </Stack>
    </AppCard>
  );
}
