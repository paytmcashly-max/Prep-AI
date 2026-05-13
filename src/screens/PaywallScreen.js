import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";

import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppIcon from "../components/ui/AppIcon";
import AppText from "../components/ui/AppText";
import BetaNoticeCard from "../components/ui/BetaNoticeCard";
import LoadingState from "../components/ui/LoadingState";
import MessageCard from "../components/ui/MessageCard";
import PlanCard from "../components/ui/PlanCard";
import ScreenHero from "../components/ui/ScreenHero";
import Screen from "../components/ui/Screen";
import { createRazorpayOrder, openRazorpayPayment } from "../services/subscriptionService";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { SPACING, useAppTheme } from "../theme";

const FALLBACK_PLAN_LABELS = {
  monthly: "Monthly",
  yearly: "Yearly"
};

const PLAN_BENEFITS = {
  monthly: ["Unlimited practice", "More resume scans"],
  yearly: ["Unlimited practice", "Best long-term value"]
};

const formatPrice = (amount, currency = "INR") => {
  if (!Number.isFinite(Number(amount))) {
    return null;
  }

  return new Intl.NumberFormat("en-IN", {
    currency,
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Number(amount) / 100);
};

const getPlanPrice = (plan) =>
  formatPrice(plan?.amount, plan?.currency) || plan?.displayPrice || null;

const getPlanDurationLabel = (planId) =>
  planId === "yearly" ? "365 days access" : "30 days access";

const getPlanDecisionCopy = (planId) =>
  planId === "yearly"
    ? {
        meta: "Lower yearly cost",
        subtitle: "Best for longer prep"
      }
    : {
        meta: "Shorter commitment",
        subtitle: "Best for short prep"
      };

const getSavingsCopy = (plans) => {
  const monthlyPlan = plans.find((plan) => (plan.plan || "monthly") === "monthly");
  const yearlyPlan = plans.find((plan) => (plan.plan || "monthly") === "yearly");
  const monthlyAmount = Number(monthlyPlan?.amount);
  const yearlyAmount = Number(yearlyPlan?.amount);

  if (!Number.isFinite(monthlyAmount) || !Number.isFinite(yearlyAmount) || monthlyAmount <= 0) {
    return null;
  }

  const yearlyIfMonthly = monthlyAmount * 12;
  const savings = yearlyIfMonthly - yearlyAmount;

  if (savings <= 0) {
    return null;
  }

  return `Save ${formatPrice(savings) || ""} over monthly billing.`;
};

const getPaymentNoticeFromStatus = (status, { pendingPaymentCheck = false } = {}) => {
  if (status?.isPremium) {
    return {
      message: "Your Premium plan is active on this account.",
      title: "Payment verified",
      tone: "success"
    };
  }

  if (!status?.paymentAvailable) {
    return {
      message: "You can continue using the free practice limits.",
      title: "Premium payments are not available in this beta build yet.",
      tone: "warning"
    };
  }

  const lastPaymentStatus = status?.lastPayment?.status;

  if (
    lastPaymentStatus === "reconciled_paid" ||
    lastPaymentStatus === "verified" ||
    lastPaymentStatus === "webhook_verified"
  ) {
    return {
      message: "Your payment was confirmed and Premium is now active.",
      title: "Payment verified",
      tone: "success"
    };
  }

  if (lastPaymentStatus === "cancelled") {
    return {
      message: "The payment was cancelled, so premium was not activated.",
      title: "Payment cancelled",
      tone: "warning"
    };
  }

  if (lastPaymentStatus === "expired") {
    return {
      message:
        "This payment link expired before completion. Please start again if you still want Premium.",
      title: "Payment expired",
      tone: "warning"
    };
  }

  if (lastPaymentStatus === "failed") {
    return {
      message: "The payment did not complete, so premium was not activated.",
      title: "Payment failed",
      tone: "error"
    };
  }

  if (pendingPaymentCheck || ["created", "issued", "partially_paid"].includes(lastPaymentStatus)) {
    return {
      message:
        "We are still confirming your payment. If the amount was deducted, wait a moment and check again.",
      title: "Checking payment status",
      tone: "warning"
    };
  }

  return null;
};

export default function PaywallScreen({ navigation }) {
  const { colors } = useAppTheme();
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const isSubscriptionLoading = useSubscriptionStore((state) => state.isLoading);
  const availablePlans = useSubscriptionStore((state) => state.availablePlans);
  const paymentAvailable = useSubscriptionStore((state) => state.paymentAvailable);
  const refreshSubscriptionStatus = useSubscriptionStore(
    (state) => state.refreshSubscriptionStatus
  );
  const [activePurchasePlan, setActivePurchasePlan] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState(null);
  const hasPendingPaymentCheckRef = useRef(false);
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
  const yearlySavingsCopy = useMemo(() => getSavingsCopy(plans), [plans]);

  useEffect(() => {
    let isMounted = true;

    refreshSubscriptionStatus()
      .then((status) => {
        if (!isMounted) {
          return;
        }

        setPaymentNotice(getPaymentNoticeFromStatus(status) || null);
      })
      .catch(() => {
        if (isMounted) {
          setPaymentNotice({
            message: "You can continue using the free practice limits.",
            title: "Premium payments are not available in this beta build yet.",
            tone: "warning"
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshSubscriptionStatus]);

  const refreshPlan = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setPaymentNotice(null);
      const status = await refreshSubscriptionStatus();
      if (
        status.isPremium ||
        ["cancelled", "expired", "failed"].includes(status?.lastPayment?.status || "")
      ) {
        hasPendingPaymentCheckRef.current = false;
      }
      setPaymentNotice(
        getPaymentNoticeFromStatus(status, {
          pendingPaymentCheck: hasPendingPaymentCheckRef.current
        }) || null
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSubscriptionStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && hasPendingPaymentCheckRef.current) {
        refreshPlan();
      }
    });

    return () => subscription.remove();
  }, [refreshPlan]);

  useEffect(() => {
    if (!hasPendingPaymentCheckRef.current) {
      return undefined;
    }

    let attempts = 0;
    const timer = setInterval(() => {
      if (!hasPendingPaymentCheckRef.current) {
        clearInterval(timer);
        return;
      }

      attempts += 1;
      refreshPlan();

      if (attempts >= 8 || useSubscriptionStore.getState().isPremium) {
        clearInterval(timer);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [refreshPlan, activePurchasePlan]);

  const startPayment = async (planId) => {
    if (!canPurchase) {
      setPaymentNotice({
        message: "You can continue using the free practice limits.",
        title: "Premium payments are not available in this beta build yet.",
        tone: "warning"
      });
      return;
    }

    try {
      setActivePurchasePlan(planId);
      setPaymentNotice({
        message: "Opening the secure payment page. Return to IntervueAI after payment.",
        title: "Starting payment",
        tone: "default"
      });
      const order = await createRazorpayOrder(planId);
      hasPendingPaymentCheckRef.current = true;
      await openRazorpayPayment(order);
      setPaymentNotice({
        message:
          "After payment, return to IntervueAI. We will check your plan automatically, or you can check it again here.",
        title: "Waiting for payment confirmation",
        tone: "warning"
      });
    } catch {
      hasPendingPaymentCheckRef.current = false;
      setPaymentNotice({
        message:
          "We could not open the payment page. Your account was not charged and premium was not activated. Please try again.",
        title: "Payment could not start",
        tone: "error"
      });
    } finally {
      setActivePurchasePlan(null);
    }
  };

  return (
    <Screen>
      <ScreenHero
        badge="IntervueAI Premium"
        badgeIcon="premium"
        logo
        title={isPremium ? "Premium is active" : "Unlock Premium"}
        subtitle={
          isPremium
            ? "Your plan is active and ready to use across the app."
            : "Both plans unlock the same Premium features. Only the billing duration changes."
        }
      />

      {isSubscriptionLoading ? (
        <LoadingState message="Checking your verified premium status." title="Plan loading" />
      ) : isPremium ? (
        <AppCard gradient="calm" style={styles.activeCard} tone="accent">
          <View style={styles.activeRow}>
            <AppIcon color={colors.success} name="success" size={26} />
            <View style={styles.activeCopy}>
              <AppText variant="cardTitle">Premium is active on this account</AppText>
              <AppText tone="muted" variant="bodyMuted">
                Your payment has been verified. You can go back and continue practicing.
              </AppText>
            </View>
          </View>
        </AppCard>
      ) : null}

      {paymentNotice && !isPremium ? (
        <MessageCard
          message={paymentNotice.message}
          title={paymentNotice.title}
          tone={paymentNotice.tone}
        />
      ) : null}

      {!isPremium ? (
        <>
          {paymentAvailable ? (
            <AppCard style={styles.selectionCard}>
              <AppCard style={styles.selectionGuide} tone="subtle">
                <View style={styles.selectionGuideRow}>
                  <View
                    style={[
                      styles.selectionGuideIcon,
                      { backgroundColor: colors.secondarySoft, borderColor: colors.border }
                    ]}
                  >
                    <AppIcon color={colors.secondary} name="info" size={16} />
                  </View>
                  <View style={styles.selectionGuideCopy}>
                    <AppText variant="bodyStrong">Same Premium features</AppText>
                    <AppText tone="muted" variant="bodyMuted">
                      Pick monthly for a shorter sprint or yearly for better value.
                    </AppText>
                  </View>
                </View>
              </AppCard>
              <View style={styles.packageStack}>
                {plans.map((plan) => {
                  const planId = plan.plan || "monthly";
                  const isYearly = planId === "yearly";
                  const planCopy = getPlanDecisionCopy(planId);
                  const basePrice = getPlanPrice(plan);
                  const priceLabel = basePrice
                    ? `${basePrice} ${planId === "yearly" ? "/ year" : "/ month"}`
                    : "Pricing unavailable";
                  const metaParts = [getPlanDurationLabel(planId), planCopy.meta];

                  if (isYearly && yearlySavingsCopy) {
                    metaParts.push(yearlySavingsCopy);
                  }

                  return (
                    <PlanCard
                      badge={isYearly ? "Best value" : undefined}
                      cta={
                        canPurchase
                          ? isYearly
                            ? "Pay yearly"
                            : "Pay monthly"
                          : "Payments unavailable"
                      }
                      disabled={!canPurchase || Boolean(activePurchasePlan)}
                      features={PLAN_BENEFITS[planId] || PLAN_BENEFITS.monthly}
                      icon={isYearly ? "calendar" : "premium"}
                      key={planId}
                      loading={activePurchasePlan === planId}
                      meta={metaParts.join(" ")}
                      onPress={() => startPayment(planId)}
                      price={priceLabel}
                      subtitle={planCopy.subtitle}
                      title={`${plan.label || FALLBACK_PLAN_LABELS[planId]} plan`}
                    />
                  );
                })}
              </View>
            </AppCard>
          ) : (
            <BetaNoticeCard
              message="You can continue using the free practice limits."
              title="Premium payments are not available in this beta build yet."
            />
          )}
        </>
      ) : null}

      {!isPremium ? (
        <AppCard style={styles.helpCard} tone="subtle">
          <View style={styles.helpRow}>
            <View
              style={[
                styles.helpIcon,
                { backgroundColor: colors.secondarySoft, borderColor: colors.border }
              ]}
            >
              <AppIcon color={colors.secondary} name="lock" size={18} />
            </View>
            <View style={styles.helpCopy}>
              <AppText variant="bodyStrong">Secure payment</AppText>
              <AppText tone="muted" variant="bodyMuted">
                Premium starts after backend verification.
              </AppText>
            </View>
          </View>
        </AppCard>
      ) : null}

      {!isPremium ? (
        <AppButton
          disabled={isRefreshing}
          loading={isRefreshing}
          onPress={refreshPlan}
          tone="secondary"
        >
          Check premium status
        </AppButton>
      ) : null}
      <AppButton onPress={() => navigation.goBack()} tone="ghost">
        Not now
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  activeCard: {
    gap: SPACING.md
  },
  activeCopy: {
    flex: 1,
    gap: SPACING.xs
  },
  activeRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.md
  },
  helpCard: {
    gap: SPACING.sm
  },
  helpCopy: {
    flex: 1,
    gap: SPACING.xs
  },
  helpIcon: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  helpRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.md
  },
  packageStack: {
    gap: SPACING.sm
  },
  selectionGuide: {
    gap: SPACING.sm
  },
  selectionGuideCopy: {
    flex: 1,
    gap: SPACING.xs
  },
  selectionGuideIcon: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  selectionGuideRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.md
  },
  selectionCard: {
    gap: SPACING.md
  }
});
