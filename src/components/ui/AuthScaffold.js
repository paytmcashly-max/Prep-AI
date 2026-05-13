import { StyleSheet, View } from "react-native";

import KeyboardAwareScrollView from "../KeyboardAwareScrollView";
import { SPACING, useAppTheme } from "../../theme";
import AppText from "./AppText";
import BrandMark from "./BrandMark";
import Inline from "./Inline";
import Stack from "./Stack";

export default function AuthScaffold({ children, eyebrow, subtitle, title }) {
  const { colors } = useAppTheme();

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View pointerEvents="none" style={[styles.orbTop, { backgroundColor: colors.primarySoft }]} />
      <View
        pointerEvents="none"
        style={[styles.orbBottom, { backgroundColor: colors.secondarySoft }]}
      />
      <Stack gap="xl" style={styles.shell}>
        <Inline gap="sm" style={styles.brandRow}>
          <BrandMark />
          <AppText variant="cardTitle">IntervueAI</AppText>
        </Inline>

        <Stack gap="sm" style={styles.copy}>
          {eyebrow ? (
            <AppText tone="secondary" variant="caption">
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant="screenTitle">{title}</AppText>
          {subtitle ? (
            <AppText tone="muted" variant="body">
              {subtitle}
            </AppText>
          ) : null}
        </Stack>

        {children}
      </Stack>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.screen,
    paddingBottom: 28,
    paddingTop: 28
  },
  brandRow: {
    alignSelf: "flex-start"
  },
  copy: {
    maxWidth: 390
  },
  orbBottom: {
    borderRadius: 140,
    height: 280,
    position: "absolute",
    right: -120,
    top: "48%",
    width: 280
  },
  orbTop: {
    borderRadius: 150,
    height: 300,
    left: -140,
    position: "absolute",
    top: -80,
    width: 300
  },
  shell: {
    alignSelf: "center",
    maxWidth: 440,
    width: "100%"
  }
});
