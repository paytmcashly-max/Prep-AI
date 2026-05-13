import { ActivityIndicator, StyleSheet, View } from "react-native";

import AppCard from "./AppCard";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import Stack from "./Stack";
import { RADIUS, useAppTheme } from "../../theme";

export default function LoadingState({ message = "Loading...", title }) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.card} tone="subtle">
      <Stack align="center" gap="sm">
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.secondarySoft, borderColor: colors.border }
          ]}
        >
          <AppIcon color={colors.secondary} name="sparkles" size={18} />
        </View>
        <ActivityIndicator color={colors.secondary} />
        {title ? <AppText variant="cardTitle">{title}</AppText> : null}
        <AppText style={{ textAlign: "center" }} tone="muted" variant="bodyMuted">
          {message}
        </AppText>
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    justifyContent: "center",
    minHeight: 124
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
  }
});
