import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

import HapticPressable from "../components/HapticPressable";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppIcon from "../components/ui/AppIcon";
import AppText from "../components/ui/AppText";
import BetaNoticeCard from "../components/ui/BetaNoticeCard";
import FeatureRow from "../components/ui/FeatureRow";
import Screen from "../components/ui/Screen";
import SectionHeader from "../components/ui/SectionHeader";
import {
  getOfferings,
  openSubscriptionManagement,
  purchasePackage,
  restorePurchases
} from "../services/subscriptionService";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { COLORS, PRESSED_STYLE, RADIUS, SPACING } from "../theme";

const FREE_FEATURES = [
  { available: true, label: "5 interview questions per day" },
  { available: true, label: "1 resume scan every 3 days" },
  { available: true, label: "Core answer feedback" },
  { available: false, label: "Longer interview sessions" },
  { available: false, label: "More resume scans" }
];

const PREMIUM_FEATURES = [
  "Unlimited interview practice",
  "Longer interviews: 10/15/20 questions",
  "More resume scans",
  "Detailed answer feedback",
  "Voice and video practice when available"
];

const betaPurchasesUnavailableMessage =
  "Premium purchases are not available in this beta build yet. You can continue using the free practice limits.";

const getAvailablePackages = (offerings) => {
  const currentPackages = offerings?.current?.availablePackages || [];
  return currentPackages.length
    ? currentPackages
    : Object.values(offerings?.all || {}).flatMap((offering) => offering.availablePackages || []);
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
  packageToDisplay?.product?.priceString ||
  packageToDisplay?.product?.localizedPriceString ||
  "Price unavailable";

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

        if (!subscriptionStatus.isPremium && !packages.length) {
          setStatusMessage(betaPurchasesUnavailableMessage);
        }
      } catch {
        if (isMounted) {
          setStatusMessage(betaPurchasesUnavailableMessage);
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
      Alert.alert("Purchases unavailable", betaPurchasesUnavailableMessage);
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
          "Premium not active yet",
          "Purchase completed, but premium access is not active yet. Please try Restore Purchases later or contact support."
        );
      }
    } catch (error) {
      if (error.message === "PURCHASE_CANCELLED") {
        setStatusMessage("Purchase cancelled.");
        return;
      }

      setStatusMessage(
        "Purchase could not be completed in this build. You can keep using free practice limits."
      );
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
        setStatusMessage(
          "No active premium entitlement was found. You can continue using the free practice limits."
        );
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
        "Subscription management is unavailable for this build. If you purchased through Google Play, manage it from Google Play subscriptions. If you are testing with RevenueCat Test Store, manage it from the RevenueCat dashboard."
      );
    }
  };

  return (
    <Screen>
      <AppCard gradient="premium" style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.premiumIcon}>
            <AppIcon color={COLORS.warning} name="premium" size={30} />
          </View>
          <View style={styles.heroCopy}>
            <AppText tone="primary" variant="caption">
              PrepAI Premium
            </AppText>
            <AppText variant="screenTitle">
              {isPremium ? "Premium is active" : "Practice without daily friction"}
            </AppText>
            <AppText tone="muted" variant="body">
              {isPremium
                ? "Your account has active premium access."
                : "Premium will unlock longer practice and more resume scans when billing is ready."}
            </AppText>
          </View>
        </View>
      </AppCard>

      <View style={styles.grid}>
        <AppCard style={styles.planCard}>
          <SectionHeader title="Free" subtitle="Available during beta" />
          {FREE_FEATURES.map((feature) => (
            <FeatureRow key={feature.label} available={feature.available} label={feature.label} />
          ))}
        </AppCard>
        <AppCard style={styles.planCard} tone="accent">
          <SectionHeader title="Premium" subtitle="For expanded practice" />
          {PREMIUM_FEATURES.map((feature) => (
            <FeatureRow key={feature} label={feature} />
          ))}
        </AppCard>
      </View>

      {isLoadingOfferings ? (
        <AppCard style={styles.loadingCard}>
          <ActivityIndicator color={COLORS.primary} />
          <AppText tone="muted" variant="body">
            Checking whether premium plans are available...
          </AppText>
        </AppCard>
      ) : isPremium ? (
        <AppCard tone="accent">
          <View style={styles.activeRow}>
            <AppIcon color={COLORS.success} name="success" size={26} />
            <View style={styles.activeCopy}>
              <AppText variant="cardTitle">Premium is active on this account</AppText>
              <AppText tone="muted" variant="bodyMuted">
                You can return to Practice whenever you are ready.
              </AppText>
            </View>
          </View>
        </AppCard>
      ) : availablePackages.length ? (
        <View style={styles.packageStack}>
          {availablePackages.map((availablePackage) => {
            const isSelected = selectedPackage?.identifier === availablePackage.identifier;
            const label = getPackageLabel(availablePackage);
            const isYearly = label.toLowerCase().includes("year");

            return (
              <HapticPressable
                key={availablePackage.identifier}
                onPress={() => setSelectedPackage(availablePackage)}
                style={({ pressed }) => [
                  styles.packageCard,
                  isSelected && styles.packageCardSelected,
                  pressed && PRESSED_STYLE
                ]}
              >
                <View style={styles.packageHeader}>
                  <AppText variant="cardTitle">{label}</AppText>
                  {isYearly ? (
                    <View style={styles.badge}>
                      <AppText color="#FFFFFF" variant="caption">
                        Best value
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <AppText variant="statNumber">{getPackagePrice(availablePackage)}</AppText>
              </HapticPressable>
            );
          })}
        </View>
      ) : (
        <BetaNoticeCard />
      )}

      {statusMessage ? (
        <AppText style={styles.statusText} tone="muted" variant="bodyMuted">
          {statusMessage}
        </AppText>
      ) : null}

      {!isPremium ? (
        <AppButton
          disabled={!canPurchase || isPurchasing}
          loading={isPurchasing}
          onPress={startPurchase}
        >
          {canPurchase ? "Upgrade to Premium" : "Purchases unavailable in beta"}
        </AppButton>
      ) : (
        <AppButton icon="settings" onPress={manageSubscription} tone="secondary">
          Manage Subscription
        </AppButton>
      )}

      <AppButton disabled={isRestoring} loading={isRestoring} onPress={restore} tone="secondary">
        Restore Purchases
      </AppButton>
      <AppButton onPress={() => navigation.goBack()} tone="ghost">
        Maybe Later
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  activeCopy: {
    flex: 1,
    gap: SPACING.xs
  },
  activeRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.md
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs
  },
  grid: {
    gap: SPACING.md
  },
  hero: {
    gap: SPACING.xl
  },
  heroCopy: {
    flex: 1,
    gap: SPACING.sm
  },
  heroTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.md
  },
  loadingCard: {
    alignItems: "center",
    flexDirection: "row"
  },
  packageCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.card
  },
  packageCardSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary
  },
  packageHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.md,
    justifyContent: "space-between"
  },
  packageStack: {
    gap: SPACING.md
  },
  planCard: {
    gap: SPACING.md
  },
  premiumIcon: {
    alignItems: "center",
    backgroundColor: "rgba(251, 191, 36, 0.14)",
    borderColor: "rgba(251, 191, 36, 0.34)",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    width: 58
  },
  statusText: {
    textAlign: "center"
  }
});
