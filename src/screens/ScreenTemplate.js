import { Pressable, ScrollView, Text, View } from "react-native";

import { COLORS, SPACING } from "../utils/constants";

export default function ScreenTemplate({ title, subtitle, actions = [], children }) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.lg }}
    >
      <View style={{ gap: SPACING.sm }}>
        <Text selectable style={{ color: COLORS.muted, fontSize: 14, fontWeight: "700" }}>
          PrepAI
        </Text>
        <Text selectable style={{ color: COLORS.text, fontSize: 32, fontWeight: "800" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text selectable style={{ color: COLORS.muted, fontSize: 16, lineHeight: 24 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {children}

      {actions.length ? (
        <View style={{ gap: SPACING.sm }}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              disabled={action.disabled || action.loading}
              onPress={action.onPress}
              style={({ pressed }) => ({
                alignItems: "center",
                backgroundColor: action.variant === "secondary" ? COLORS.surface : COLORS.primary,
                borderColor: COLORS.border,
                borderRadius: 14,
                borderWidth: action.variant === "secondary" ? 1 : 0,
                opacity: pressed || action.disabled || action.loading ? 0.7 : 1,
                padding: SPACING.md
              })}
            >
              <Text
                selectable
                style={{
                  color: action.variant === "secondary" ? COLORS.text : COLORS.surface,
                  fontSize: 16,
                  fontWeight: "700"
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
