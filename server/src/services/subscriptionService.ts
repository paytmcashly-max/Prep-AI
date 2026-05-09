export type SubscriptionSyncInput = {
  activeEntitlements: string[];
  entitlementId: string;
  expirationDate?: string | null;
  isPremium: boolean;
  source: "revenuecat";
};

// Client-reported RevenueCat status is useful for diagnostics/UI sync, but it is
// not authoritative for backend usage-limit bypass. Replace this with RevenueCat
// webhook or server-side API verification before trusting premium access.
export const createUnverifiedSubscriptionRecord = (input: SubscriptionSyncInput) => ({
  activeEntitlements: input.activeEntitlements,
  clientReportedIsPremium:
    input.isPremium && input.activeEntitlements.includes(input.entitlementId),
  entitlementId: input.entitlementId,
  expirationDate: input.expirationDate || null,
  isPremium: false,
  source: input.source,
  verificationStatus: "client_reported_unverified" as const
});
