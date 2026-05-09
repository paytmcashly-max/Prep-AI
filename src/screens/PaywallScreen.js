import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import HapticPressable from "../components/HapticPressable";
import AppIcon from "../components/ui/AppIcon";
import {
  getOfferings,
  openSubscriptionManagement,
  purchasePackage,
  restorePurchases
} from "../services/subscriptionService";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { COLORS } from "../theme";

const FREE_FEATURES = [
  { available: true, label: "5 interview questions/day" },
  { available: true, label: "1 resume scan every 3 days" },
  { available: true, label: "Basic feedback" },
  { available: false, label: "Longer interviews" },
  { available: false, label: "More resume scans" },
  { available: false, label: "Unlimited practice" }
];

const PREMIUM_FEATURES = [
  "Unlimited interview practice",
  "Longer interviews: 10/15/20 questions",
  "More resume scans",
  "Detailed answer feedback",
  "Premium features as they launch"
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

// Real Google Play/App Store products return localized store pricing through RevenueCat.
// Test Store pricing may reflect the configured Test Store product price.
const getPackagePrice = (packageToDisplay) =>
  packageToDisplay?.product?.priceString ||
  packageToDisplay?.product?.localizedPriceString ||
  "Price unavailable";

function FeatureRow({ available = true, label }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <AppIcon
          color={available ? COLORS.success : COLORS.danger}
          name={available ? "check" : "close"}
          size={18}
          strokeWidth={2.7}
        />
      </View>
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
  const managementUrl = useSubscriptionStore((state) => state.managementUrl);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const availablePackages = useMemo(() => getAvailablePackages(offerings), [offerings]);
  const canPurchase = !isLoadingOfferings && !isPremium && Boolean(selectedPackage);

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

        if (!subscriptionStatus.isPremium && packages.length) {
          setStatusMessage("");
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
      Alert.alert("No plans available", "Purchases are not available in this beta build yet.");
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

  const manageSubscription = async () => {
    try {
      await openSubscriptionManagement(managementUrl);
    } catch {
      Alert.alert(
        "Manage subscription",
        "Subscription management is unavailable for this build. If you purchased through Google Play, open Google Play Store > Payments & subscriptions > Subscriptions. If you are testing with RevenueCat Test Store, manage the test purchase from the RevenueCat dashboard."
      );
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
          <View style={[styles.messageCard, styles.successMessageCard]}>
            <AppIcon color={COLORS.success} name="success" size={34} />
            <Text selectable style={styles.statusEyebrow}>
              Premium Status
            </Text>
            <Text selectable style={styles.messageTitle}>
              Premium is active on this account
            </Text>
            <Text selectable style={styles.messageText}>
              Unlimited practice is unlocked. You can return to Practice whenever you are ready.
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
                        Best value
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text selectable style={styles.planPrice}>
                  {getPackagePrice(availablePackage)}
                </Text>
              </HapticPressable>
            );
          })
        ) : (
          <View style={[styles.messageCard, styles.warningMessageCard]}>
            <AppIcon color={COLORS.warning} name="warning" size={34} />
            <Text selectable style={styles.statusEyebrow}>
              Plans unavailable
            </Text>
            <Text selectable style={styles.messageTitle}>
              Purchases unavailable
            </Text>
            <Text selectable style={styles.messageText}>
              Purchases are not available in this beta build yet. Free practice still works.
            </Text>
          </View>
        )}
      </View>

      {statusMessage ? (
        <Text selectable style={styles.statusText}>
          {statusMessage}
        </Text>
      ) : null}

      {isPremium || canPurchase ? (
        <View style={styles.actionSection}>
          <HapticPressable
            disabled={!canPurchase || isPurchasing || isPremium}
            onPress={startPurchase}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && !isPurchasing && styles.pressed,
              (!canPurchase || isPurchasing || isPremium) && styles.disabledButton
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
          {canPurchase ? (
            <Text selectable style={styles.cancelText}>
              Cancel anytime from your store subscription settings.
            </Text>
          ) : null}
        </View>
      ) : null}

      {isPremium ? (
        <HapticPressable
          onPress={manageSubscription}
          style={({ pressed }) => [styles.manageButton, pressed && styles.pressed]}
        >
          <Text style={styles.manageButtonText}>Manage Subscription</Text>
        </HapticPressable>
      ) : null}

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
  disabledButton: {
    opacity: 0.65
  },
  featureIcon: {
    alignItems: "center",
    justifyContent: "center",
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
  manageButton: {
    alignItems: "center",
    backgroundColor: "rgba(108, 99, 255, 0.12)",
    borderColor: "rgba(108, 99, 255, 0.45)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  manageButtonText: {
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
  statusEyebrow: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  successMessageCard: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderColor: "rgba(34, 197, 94, 0.45)"
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
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 40
  },
  warningMessageCard: {
    backgroundColor: "#141414",
    borderColor: "rgba(250, 204, 21, 0.35)"
  }
});
