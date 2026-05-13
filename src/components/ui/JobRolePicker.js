import { ScrollView, StyleSheet, View } from "react-native";
import { useState } from "react";

import { RADIUS, SPACING, useAppTheme } from "../../theme";
import AppCard from "./AppCard";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import ListRow from "./ListRow";

const DEFAULT_JOB_ROLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Android Developer",
  "Data Scientist",
  "MBA/Management"
];

export default function JobRolePicker({
  label = "Job role",
  options = DEFAULT_JOB_ROLES,
  placeholder = "Select target role",
  rowLabel = "Target role",
  selectedValue,
  onSelect
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useAppTheme();

  return (
    <View style={styles.field}>
      <AppText variant="bodyStrong">{label}</AppText>
      <ListRow
        detail={selectedValue || placeholder}
        icon="briefcase"
        label={rowLabel}
        onPress={() => setIsOpen((current) => !current)}
        right={<AppIcon color={colors.muted} name={isOpen ? "up" : "down"} size={18} />}
      />

      {isOpen ? (
        <AppCard style={styles.optionsPanel} tone="subtle">
          <ScrollView nestedScrollEnabled style={styles.optionsScroll}>
            {options.map((role) => {
              const isSelected = role === selectedValue;

              return (
                <ListRow
                  detail={isSelected ? "Selected" : null}
                  icon={isSelected ? "check" : "briefcase"}
                  key={role}
                  label={role}
                  onPress={() => {
                    onSelect(role);
                    setIsOpen(false);
                  }}
                />
              );
            })}
          </ScrollView>
        </AppCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: SPACING.sm
  },
  optionsPanel: {
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    padding: SPACING.sm
  },
  optionsScroll: {
    maxHeight: 230
  }
});
