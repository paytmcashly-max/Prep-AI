import { create } from "zustand";

import {
  identifyPurchasesUser,
  refreshSubscriptionStatus as refreshRevenueCatStatus,
  resetPurchasesUser
} from "../services/subscriptionService";
import { syncSubscriptionStatusToFirestore } from "../services/subscriptionSyncService";

const defaultSubscriptionState = {
  activeEntitlements: [],
  expirationDate: null,
  isLoading: false,
  isPremium: false,
  lastUpdatedAt: null,
  managementUrl: null,
  source: "unknown"
};

const syncSubscriptionStatusSafely = async (status) => {
  try {
    await syncSubscriptionStatusToFirestore(status);
  } catch (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("Subscription status sync failed", {
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
};

export const useSubscriptionStore = create((set) => ({
  ...defaultSubscriptionState,
  identifySubscriptionUser: async (userId) => {
    set({ isLoading: true });

    try {
      const status = await identifyPurchasesUser(userId);
      await syncSubscriptionStatusSafely(status);

      set({
        activeEntitlements: status.activeEntitlements || [],
        expirationDate: status.expirationDate || null,
        isLoading: false,
        isPremium: Boolean(status.isPremium),
        lastUpdatedAt: new Date().toISOString(),
        managementUrl: status.managementUrl || null,
        source: status.source || "revenuecat"
      });

      return status;
    } catch (error) {
      set({
        isLoading: false,
        isPremium: false,
        source: "error"
      });
      throw error;
    }
  },
  refreshSubscriptionStatus: async () => {
    set({ isLoading: true });

    try {
      const status = await refreshRevenueCatStatus();
      await syncSubscriptionStatusSafely(status);

      set({
        activeEntitlements: status.activeEntitlements || [],
        expirationDate: status.expirationDate || null,
        isLoading: false,
        isPremium: Boolean(status.isPremium),
        lastUpdatedAt: new Date().toISOString(),
        managementUrl: status.managementUrl || null,
        source: status.source || "revenuecat"
      });

      return status;
    } catch (error) {
      set({
        isLoading: false,
        isPremium: false,
        source: "error"
      });
      throw error;
    }
  },
  resetSubscription: () => {
    resetPurchasesUser();
    set({ ...defaultSubscriptionState });
  },
  setSubscriptionStatus: async (status) => {
    await syncSubscriptionStatusSafely(status);
    set({
      activeEntitlements: status.activeEntitlements || [],
      expirationDate: status.expirationDate || null,
      isPremium: Boolean(status.isPremium),
      lastUpdatedAt: new Date().toISOString(),
      managementUrl: status.managementUrl || null,
      source: status.source || "revenuecat"
    });
  }
}));
