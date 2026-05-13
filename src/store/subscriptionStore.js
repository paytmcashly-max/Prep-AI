import { create } from "zustand";

import {
  identifySubscriptionUser,
  refreshSubscriptionStatus as refreshBackendSubscriptionStatus,
  resetSubscriptionUser
} from "../services/subscriptionService";

const defaultSubscriptionState = {
  activeEntitlements: [],
  availablePlans: [],
  expirationDate: null,
  isLoading: false,
  isPremium: false,
  lastPayment: null,
  lastUpdatedAt: null,
  paymentAvailable: false,
  plan: null,
  provider: "razorpay",
  source: "unknown",
  verificationStatus: "none"
};

export const useSubscriptionStore = create((set) => ({
  ...defaultSubscriptionState,
  identifySubscriptionUser: async (userId) => {
    set({ isLoading: true });

    try {
      const status = await identifySubscriptionUser(userId);

      set({
        activeEntitlements: status.activeEntitlements || [],
        availablePlans: status.availablePlans || [],
        expirationDate: status.expirationDate || null,
        isLoading: false,
        isPremium: Boolean(status.isPremium),
        lastPayment: status.lastPayment || null,
        lastUpdatedAt: new Date().toISOString(),
        paymentAvailable: Boolean(status.paymentAvailable),
        plan: status.plan || null,
        provider: status.provider || "razorpay",
        source: status.source || "razorpay",
        verificationStatus: status.verificationStatus || "none"
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
      const status = await refreshBackendSubscriptionStatus();

      set({
        activeEntitlements: status.activeEntitlements || [],
        availablePlans: status.availablePlans || [],
        expirationDate: status.expirationDate || null,
        isLoading: false,
        isPremium: Boolean(status.isPremium),
        lastPayment: status.lastPayment || null,
        lastUpdatedAt: new Date().toISOString(),
        paymentAvailable: Boolean(status.paymentAvailable),
        plan: status.plan || null,
        provider: status.provider || "razorpay",
        source: status.source || "razorpay",
        verificationStatus: status.verificationStatus || "none"
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
    resetSubscriptionUser();
    set({ ...defaultSubscriptionState });
  },
  setSubscriptionStatus: (status) => {
    set({
      activeEntitlements: status.activeEntitlements || [],
      availablePlans: status.availablePlans || [],
      expirationDate: status.expirationDate || null,
      isPremium: Boolean(status.isPremium),
      lastPayment: status.lastPayment || null,
      lastUpdatedAt: new Date().toISOString(),
      paymentAvailable: Boolean(status.paymentAvailable),
      plan: status.plan || null,
      provider: status.provider || "razorpay",
      source: status.source || "razorpay",
      verificationStatus: status.verificationStatus || "none"
    });
  }
}));
