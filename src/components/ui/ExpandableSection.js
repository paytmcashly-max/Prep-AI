import { useState } from "react";

import HapticPressable from "../HapticPressable";
import AppCard from "./AppCard";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import Inline from "./Inline";
import Stack from "./Stack";
import { PRESSED_STYLE, useAppTheme } from "../../theme";

export default function ExpandableSection({ children, defaultOpen = false, subtitle, title }) {
  const [open, setOpen] = useState(defaultOpen);
  const { colors } = useAppTheme();

  return (
    <AppCard tone="subtle">
      <Stack gap="sm">
        <HapticPressable
          onPress={() => setOpen((current) => !current)}
          style={({ pressed }) => [pressed && PRESSED_STYLE]}
        >
          <Inline justify="space-between">
            <Stack gap="xs" style={{ flex: 1 }}>
              <AppText variant="cardTitle">{title}</AppText>
              {subtitle ? (
                <AppText tone="muted" variant="bodyMuted">
                  {subtitle}
                </AppText>
              ) : null}
            </Stack>
            <AppIcon color={colors.secondary} name={open ? "up" : "down"} size={18} />
          </Inline>
        </HapticPressable>
        {open ? children : null}
      </Stack>
    </AppCard>
  );
}
