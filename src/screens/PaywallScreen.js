import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import HapticPressable from "../components/HapticPressable";
import { getOfferings, purchasePackage, restorePurchases } from "../services/subscriptionService";
import { useSubscriptionStore } from "../store/subscriptionStore";

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

const getAvailablePackages = (offerings) => {
  const currentPackages = offerings?.current?.availablePackages || [];

  if (currentPackages.length) {
    return currentPackages;
  }

  return Object.values(offerings?.all || {}).flatMap(
    (offering) => offering.availablePackages || []
  );
};

const getPackageLabel = (packageToDisplay) => {
  const identifier = String(packageToDisplay?.identifier || "").toLowerCase();
  const packageType = String(packageToDisplay?.packageType || "").toLowerCase();

  if (
    identifier.includes("annual") ||
    identifier.includes("year") ||
    packageType.includes("annual")
  ) {
    return "Yearly";
  }

  if (identifier.includes("month") || packageType.includes("monthly")) {
    return "Monthly";
  }

  return packageToDisplay?.product?.title || packageToDisplay?.identifier || "Premium";
};

const getPackagePrice = (packageToDisplay) =>
  packageToDisplay?.product?.priceString || packageToDisplay?.product?.localizedPriceString || "";

function FeatureRow({ available = true, label }) {
  return (
    <View style={styles.featureRow}>
      <Text
        selectable
        style={[styles.featureIcon, available ? styles.successText : styles.dangerText]}
      >
        {available ? "Yes" : "No"}
      </Text>
      <Text selectable style={styles.featureText}>
        {label}
      </Text>
    </View>
  );
}

export default function PaywallScreen({ navigation }) {
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const refreshSubscriptionStatus = useSubscriptionStore(
    (state) => state.refreshSubscriptionStatus
  );
  const setSubscriptionStatus = useSubscriptionStore((state) => state.setSubscriptionStatus);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const availablePackages = useMemo(() => getAvailablePackages(offerings), [offerings]);

  useEffect(() => {
    let isMounted = true;

    const loadOfferings = async () => {
      try {
        setIsLoadingOfferings(true);
        setStatusMessage("");

        const [subscriptionStatus, loadedOfferings] = await Promise.all([
          refreshSubscriptionStatus(),
          getOfferings()
        ]);
        const packages = getAvailablePackages(loadedOfferings);

        if (!isMounted) {
          return;
        }

        setOfferings(loadedOfferings);
        setSelectedPackage(packages[0] || null);

        if (subscriptionStatus.isPremium) {
          setStatusMessage("Premium is active on this account.");
        } else if (!packages.length) {
          setStatusMessage("No premium plans are available for this build yet.");
        }
      } catch {
        if (isMounted) {
          setStatusMessage("Could not load premium plans. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingOfferings(false);
        }
      }
    };

    loadOfferings();

    return () => {
      isMounted = false;
    };
  }, [refreshSubscriptionStatus]);

  const startPurchase = async () => {
    if (!selectedPackage) {
      Alert.alert("No plans available", "Premium plans are not available right now.");
      return;
    }

    try {
      setIsPurchasing(true);
      setStatusMessage("");

      const status = await purchasePackage(selectedPackage);
      await setSubscriptionStatus(status);

      if (status.isPremium) {
        Alert.alert("Premium active", "Your premium access is now active.");
      } else {
        Alert.alert(
          "Purchase completed",
          "Purchase completed, but the premium entitlement was not activated. Check RevenueCat entitlement/product mapping."
        );
      }
    } catch (error) {
      if (error.message === "PURCHASE_CANCELLED") {
        setStatusMessage("Purchase cancelled.");
        return;
      }

      setStatusMessage("Purchase failed. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  const restore = async () => {
    try {
      setIsRestoring(true);
      setStatusMessage("");

      const status = await restorePurchases();
      await setSubscriptionStatus(status);

      if (status.isPremium) {
        Alert.alert("Restored", "Your premium access has been restored.");
      } else {
        setStatusMessage("No active premium entitlement found for this account.");
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Upgrade to Premium
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
              <FeatureRow key={feature.label} available={feature.available} label={feature.label} />
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
        {isLoadingOfferings ? (
          <View style={styles.messageCard}>
            <ActivityIndicator color={COLORS.text} />
            <Text selectable style={styles.messageTitle}>
              Loading plans
            </Text>
            <Text selectable style={styles.messageText}>
              Checking available Test Store or billing packages.
            </Text>
          </View>
        ) : isPremium ? (
          <View style={styles.messageCard}>
            <Text selectable style={styles.messageTitle}>
              Premium is active on this account
            </Text>
            <Text selectable style={styles.messageText}>
              Your premium entitlement is active. Enjoy unlimited practice.
            </Text>
          </View>
        ) : availablePackages.length ? (
          availablePackages.map((availablePackage) => {
            const isSelected = selectedPackage?.identifier === availablePackage.identifier;
            const label = getPackageLabel(availablePackage);
            const isYearly = label.toLowerCase().includes("year");

            return (
              <HapticPressable
                key={availablePackage.identifier}
                onPress={() => setSelectedPackage(availablePackage)}
                style={({ pressed }) => [
                  styles.planCard,
                  (isSelected || isYearly) && styles.highlightedPlanCard,
                  pressed && styles.pressed
                ]}
              >
                <View style={styles.planHeaderRow}>
                  <Text selectable style={styles.planLabel}>
                    {label}
                  </Text>
                  {isYearly ? (
                    <View style={styles.saveBadge}>
                      <Text selectable style={styles.saveBadgeText}>
                        Save 44%
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text selectable style={styles.planPrice}>
                  {getPackagePrice(availablePackage) || "Price unavailable"}
                </Text>
              </HapticPressable>
            );
          })
        ) : (
          <View style={styles.messageCard}>
            <Text selectable style={styles.messageTitle}>
              No plans available
            </Text>
            <Text selectable style={styles.messageText}>
              Check RevenueCat Test Store offerings and rebuild after changing EAS env values.
            </Text>
          </View>
        )}
      </View>

      {statusMessage ? (
        <Text selectable style={styles.statusText}>
          {statusMessage}
        </Text>
      ) : null}

      <View style={styles.actionSection}>
        <HapticPressable
          disabled={isLoadingOfferings || isPurchasing || !selectedPackage || isPremium}
          onPress={startPurchase}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && !isPurchasing && styles.pressed,
            (isLoadingOfferings || isPurchasing || !selectedPackage || isPremium) &&
              styles.disabledButton
          ]}
        >
          {isPurchasing ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.ctaButtonText}>
              {isPremium ? "Premium Active" : "Start 3-Day Free Trial"}
            </Text>
          )}
        </HapticPressable>
        <Text selectable style={styles.cancelText}>
          Cancel anytime
        </Text>
      </View>

      <HapticPressable
        disabled={isRestoring}
        onPress={restore}
        style={({ pressed }) => [
          styles.restoreButton,
          pressed && !isRestoring && styles.pressed,
          isRestoring && styles.disabledButton
        ]}
      >
        {isRestoring ? (
          <ActivityIndicator color={COLORS.text} />
        ) : (
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        )}
      </HapticPressable>

      <HapticPressable
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [styles.laterButton, pressed && styles.pressed]}
      >
        <Text style={styles.laterButtonText}>Maybe Later</Text>
      </HapticPressable>
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
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 22,
    width: 34
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
  highlightedPlanCard: {
    borderColor: COLORS.accent,
    borderWidth: 2
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
  messageCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    justifyContent: "center",
    minHeight: 96,
    padding: 18
  },
  messageText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center"
  },
  messageTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center"
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
  restoreButton: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  restoreButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
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
  statusText: {
    backgroundColor: "rgba(108, 99, 255, 0.12)",
    borderColor: "rgba(108, 99, 255, 0.35)",
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    padding: 12
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
  }
});
