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
import { createRazorpayOrder, openRazorpayPayment } from "../services/subscriptionService";
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

const betaPaymentsUnavailableMessage =
  "Premium payments are not available in this beta build yet. You can continue using the free practice limits.";

const FALLBACK_PLAN_LABELS = {
  monthly: "Monthly",
  yearly: "Yearly"
};

export default function PaywallScreen({ navigation }) {
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const isSubscriptionLoading = useSubscriptionStore((state) => state.isLoading);
  const availablePlans = useSubscriptionStore((state) => state.availablePlans);
  const paymentAvailable = useSubscriptionStore((state) => state.paymentAvailable);
  const refreshSubscriptionStatus = useSubscriptionStore(
    (state) => state.refreshSubscriptionStatus
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [statusMessage, setStatusMessage] = useState("");
  const plans = useMemo(
    () =>
      availablePlans.length
        ? availablePlans
        : [
            { label: "Monthly", plan: "monthly" },
            { label: "Yearly", plan: "yearly" }
          ],
    [availablePlans]
  );
  const canPurchase = !isSubscriptionLoading && !isPremium && paymentAvailable;

  useEffect(() => {
    let isMounted = true;

    refreshSubscriptionStatus()
      .then((status) => {
        if (!isMounted) {
          return;
        }

        if (!status.isPremium && !status.paymentAvailable) {
          setStatusMessage(betaPaymentsUnavailableMessage);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatusMessage(betaPaymentsUnavailableMessage);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshSubscriptionStatus]);

  const refreshPlan = async () => {
    try {
      setIsRefreshing(true);
      setStatusMessage("");
      const status = await refreshSubscriptionStatus();

      if (status.isPremium) {
        Alert.alert("Premium active", "Your premium access is active on this account.");
      } else if (!status.paymentAvailable) {
        setStatusMessage(betaPaymentsUnavailableMessage);
      } else {
        setStatusMessage("Premium is not active yet. If you just paid, please wait a moment.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const startPayment = async () => {
    if (!canPurchase) {
      Alert.alert("Payments unavailable", betaPaymentsUnavailableMessage);
      return;
    }

    try {
      setIsPurchasing(true);
      setStatusMessage("");
      const order = await createRazorpayOrder(selectedPlan);
      await openRazorpayPayment(order);
      setStatusMessage("Complete payment in Razorpay, then tap Refresh premium status.");
    } catch {
      setStatusMessage(betaPaymentsUnavailableMessage);
    } finally {
      setIsPurchasing(false);
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
              IntervueAI Premium
            </AppText>
            <AppText variant="screenTitle">
              {isPremium ? "Premium is active" : "Practice without daily friction"}
            </AppText>
            <AppText tone="muted" variant="body">
              {isPremium
                ? "Your account has server-verified premium access."
                : "Premium unlocks longer practice and more resume scans when payments are ready."}
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
          <SectionHeader title="Premium" subtitle="Powered by Razorpay verification" />
          {PREMIUM_FEATURES.map((feature) => (
            <FeatureRow key={feature} label={feature} />
          ))}
        </AppCard>
      </View>

      {isSubscriptionLoading ? (
        <AppCard style={styles.loadingCard}>
          <ActivityIndicator color={COLORS.primary} />
          <AppText tone="muted" variant="body">
            Checking premium status...
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
      ) : paymentAvailable ? (
        <View style={styles.packageStack}>
          {plans.map((plan) => {
            const planId = plan.plan || "monthly";
            const isSelected = selectedPlan === planId;
            const isYearly = planId === "yearly";

            return (
              <HapticPressable
                key={planId}
                onPress={() => setSelectedPlan(planId)}
                style={({ pressed }) => [
                  styles.packageCard,
                  isSelected && styles.packageCardSelected,
                  pressed && PRESSED_STYLE
                ]}
              >
                <View style={styles.packageHeader}>
                  <AppText variant="cardTitle">
                    {plan.label || FALLBACK_PLAN_LABELS[planId]}
                  </AppText>
                  {isYearly ? (
                    <View style={styles.badge}>
                      <AppText color="#FFFFFF" variant="caption">
                        Best value
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <AppText variant="statNumber">{plan.displayPrice || "Price from Razorpay"}</AppText>
              </HapticPressable>
            );
          })}
        </View>
      ) : (
        <BetaNoticeCard
          message="You can continue using the free practice limits."
          title="Premium payments are not available in this beta build yet."
        />
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
          onPress={startPayment}
        >
          {canPurchase ? "Continue to payment" : "Payments unavailable in beta"}
        </AppButton>
      ) : null}

      <AppButton
        disabled={isRefreshing}
        loading={isRefreshing}
        onPress={refreshPlan}
        tone="secondary"
      >
        Refresh premium status
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
