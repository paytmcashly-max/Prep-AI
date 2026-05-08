import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { postAuthenticatedJson } from "./apiClient";
import { auth, firestore } from "./firebaseConfig";

const DEFAULT_ENTITLEMENT_ID = "premium";

const getEntitlementId = (status) =>
  status?.entitlementId ||
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ||
  DEFAULT_ENTITLEMENT_ID;

export const syncSubscriptionStatusToFirestore = async (status) => {
  const uid = auth.currentUser?.uid;

  if (!uid || !status) {
    return;
  }

  const payload = {
    activeEntitlements: Array.isArray(status.activeEntitlements) ? status.activeEntitlements : [],
    entitlementId: getEntitlementId(status),
    expirationDate: status.expirationDate || null,
    isPremium: Boolean(status.isPremium),
    source: "revenuecat"
  };

  try {
    await postAuthenticatedJson("/api/subscription/sync", payload);
    return;
  } catch (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("Backend subscription sync failed; trying Firestore fallback", {
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  await setDoc(
    doc(firestore, "users", uid, "subscription", "main"),
    {
      ...payload,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};
