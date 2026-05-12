import { getFirebaseAdmin } from "../firebaseAdmin.js";
import { logger } from "../logger.js";
import { isSubscriptionActiveFromData } from "./usageService.js";

export type PremiumPlan = "monthly" | "yearly";

export type ServerVerifiedSubscriptionInput = {
  expirationDate: string;
  orderId?: string | null;
  paymentId?: string | null;
  plan: PremiumPlan;
};

const subscriptionCollectionPath = "subscription";
const subscriptionDocumentId = "main";

export const createServerVerifiedSubscriptionRecord = ({
  expirationDate,
  orderId = null,
  paymentId = null,
  plan
}: ServerVerifiedSubscriptionInput) => ({
  expirationDate,
  isPremium: true,
  orderId,
  paymentId,
  plan,
  provider: "razorpay",
  source: "razorpay",
  verificationStatus: "server_verified" as const
});

const serializeFirestoreValue = (value: unknown): unknown => {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return value;
};

export const writeServerVerifiedSubscription = async (
  uid: string,
  input: ServerVerifiedSubscriptionInput
) => {
  const firebaseAdmin = getFirebaseAdmin();
  const record = createServerVerifiedSubscriptionRecord(input);

  await firebaseAdmin
    .firestore()
    .collection("users")
    .doc(uid)
    .collection(subscriptionCollectionPath)
    .doc(subscriptionDocumentId)
    .set(
      {
        ...record,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

  return record;
};

export const getUserSubscriptionStatus = async (uid: string) => {
  try {
    const snapshot = await getFirebaseAdmin()
      .firestore()
      .collection("users")
      .doc(uid)
      .collection(subscriptionCollectionPath)
      .doc(subscriptionDocumentId)
      .get();

    if (!snapshot.exists) {
      return {
        expirationDate: null,
        isPremium: false,
        plan: null,
        provider: "razorpay",
        source: "razorpay",
        verificationStatus: "none"
      };
    }

    const data = snapshot.data() || {};
    const isPremium = isSubscriptionActiveFromData(data);

    return {
      expirationDate: typeof data.expirationDate === "string" ? data.expirationDate : null,
      isPremium,
      plan: typeof data.plan === "string" ? data.plan : null,
      provider: data.provider === "razorpay" ? "razorpay" : "unknown",
      source: data.source === "razorpay" ? "razorpay" : "unknown",
      updatedAt: serializeFirestoreValue(data.updatedAt),
      verificationStatus:
        data.verificationStatus === "server_verified" ? "server_verified" : "unverified"
    };
  } catch (error) {
    logger.warn("Subscription status lookup failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorName: error instanceof Error ? error.name : "UnknownError"
    });

    return {
      expirationDate: null,
      isPremium: false,
      plan: null,
      provider: "razorpay",
      source: "razorpay",
      verificationStatus: "error"
    };
  }
};
