import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const COLORS = {
  accent: "#6C63FF",
  background: "#0A0A0A",
  card: "#1A1A1A",
  border: "#2A2A2A",
  danger: "#EF4444",
  muted: "#A3A3A3",
  success: "#22C55E",
  text: "#FFFFFF"
};

const FREE_FEATURES = [
  { available: true, label: "5 questions/day" },
  { available: true, label: "Text mode only" },
  { available: true, label: "Basic feedback" },
  { available: false, label: "Voice mode" },
  { available: false, label: "Resume downloads" },
  { available: false, label: "Unlimited questions" }
];

const PREMIUM_FEATURES = [
  "Unlimited questions",
  "Voice + Video mode",
  "Detailed AI feedback",
  "Unlimited resume scans",
  "Ad-free experience",
  "Company specific banks"
];

function FeatureRow({ available = true, label }) {
  return (
    <View style={styles.featureRow}>
      <Text selectable style={[styles.featureIcon, available ? styles.successText : styles.dangerText]}>
        {available ? "✅" : "❌"}
      </Text>
      <Text selectable style={styles.featureText}>
        {label}
      </Text>
    </View>
  );
}

export default function PaywallScreen({ navigation }) {
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const showComingSoon = () => {
    setIsStartingTrial(true);

    setTimeout(() => {
      setIsStartingTrial(false);
      Alert.alert("Payment coming soon!");
    }, 250);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Upgrade to Premium 👑
        </Text>
        <Text selectable style={styles.subtitle}>
          Unlock your full potential
        </Text>
      </View>

      <View style={styles.comparisonGrid}>
        <View style={styles.comparisonCard}>
          <Text selectable style={styles.sectionEyebrow}>
            FREE
          </Text>
          <View style={styles.featureList}>
            {FREE_FEATURES.map((feature) => (
              <FeatureRow
                key={feature.label}
                available={feature.available}
                label={feature.label}
              />
            ))}
          </View>
        </View>

        <View style={[styles.comparisonCard, styles.premiumCard]}>
          <Text selectable style={[styles.sectionEyebrow, styles.premiumEyebrow]}>
            PREMIUM
          </Text>
          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((feature) => (
              <FeatureRow key={feature} label={feature} />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.planSection}>
        <View style={styles.planCard}>
          <Text selectable style={styles.planLabel}>
            Monthly
          </Text>
          <Text selectable style={styles.planPrice}>
            ₹299/month
          </Text>
        </View>

        <View style={[styles.planCard, styles.yearlyPlanCard]}>
          <View style={styles.planHeaderRow}>
            <Text selectable style={styles.planLabel}>
              Yearly
            </Text>
            <View style={styles.saveBadge}>
              <Text selectable style={styles.saveBadgeText}>
                Save 44%
              </Text>
            </View>
          </View>
          <Text selectable style={styles.planPrice}>
            ₹1,999/year
          </Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        <Pressable
          disabled={isStartingTrial}
          onPress={showComingSoon}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && !isStartingTrial && styles.pressed,
            isStartingTrial && styles.disabledButton
          ]}
        >
          {isStartingTrial ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.ctaButtonText}>Start 3-Day Free Trial</Text>
          )}
        </Pressable>
        <Text selectable style={styles.cancelText}>
          Cancel anytime
        </Text>
      </View>

      <Pressable
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [styles.laterButton, pressed && styles.pressed]}
      >
        <Text style={styles.laterButtonText}>Maybe Later</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionSection: {
    alignItems: "center",
    gap: 10
  },
  cancelText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  comparisonCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 18
  },
  comparisonGrid: {
    gap: 16
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1
  },
  content: {
    gap: 24,
    padding: 20,
    paddingBottom: 44
  },
  ctaButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 60,
    paddingHorizontal: 18,
    width: "100%"
  },
  ctaButtonText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center"
  },
  dangerText: {
    color: COLORS.danger
  },
  disabledButton: {
    opacity: 0.65
  },
  featureIcon: {
    fontSize: 17,
    lineHeight: 24,
    width: 26
  },
  featureList: {
    gap: 12
  },
  featureRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  featureText: {
    color: COLORS.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22
  },
  header: {
    gap: 8,
    paddingTop: 8
  },
  laterButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16
  },
  laterButtonText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "800"
  },
  planCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 18
  },
  planHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  planLabel: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  planPrice: {
    color: COLORS.text,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 31
  },
  planSection: {
    gap: 14
  },
  premiumCard: {
    borderColor: "rgba(108, 99, 255, 0.45)"
  },
  premiumEyebrow: {
    color: COLORS.accent
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  saveBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.14)",
    borderColor: "rgba(34, 197, 94, 0.45)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  saveBadgeText: {
    color: "#86EFAC",
    fontSize: 12,
    fontWeight: "900"
  },
  sectionEyebrow: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24
  },
  successText: {
    color: COLORS.success
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 40
  },
  yearlyPlanCard: {
    borderColor: COLORS.accent,
    borderWidth: 2
  }
});
