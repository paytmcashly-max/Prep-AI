import crypto from "node:crypto";

import { config } from "../config.js";
import { getFirebaseAdmin } from "../firebaseAdmin.js";
import { logger } from "../logger.js";
import { type PremiumPlan, writeServerVerifiedSubscription } from "./subscriptionService.js";

type RazorpayPlanConfig = {
  amount?: number;
  currency: "INR";
  durationDays: number;
  label: string;
  plan: PremiumPlan;
};

type CreatePaymentLinkInput = {
  email?: string;
  plan: PremiumPlan;
  uid: string;
};

type StoredPaymentRecord = {
  createdAt?: unknown;
  paymentId?: string | null;
  paymentLinkId: string;
  plan: PremiumPlan;
  status?: string;
  uid: string;
  updatedAt?: unknown;
};

type VerifyPaymentInput = {
  paymentId?: string;
  paymentLinkId?: string;
  paymentLinkReferenceId?: string;
  paymentLinkStatus?: string;
  signature?: string;
};

export class RazorpayUnavailableError extends Error {
  constructor() {
    super("Premium payments are not available in this beta build yet.");
    this.name = "RazorpayUnavailableError";
  }
}

export class RazorpayVerificationError extends Error {
  constructor() {
    super("Payment verification failed.");
    this.name = "RazorpayVerificationError";
  }
}

const razorpayApiBaseUrl = "https://api.razorpay.com/v1";
const paymentsCollection = "razorpayPayments";

export const razorpayPlans: Record<PremiumPlan, RazorpayPlanConfig> = {
  monthly: {
    amount: config.RAZORPAY_PREMIUM_MONTHLY_AMOUNT,
    currency: "INR",
    durationDays: 30,
    label: "Monthly",
    plan: "monthly"
  },
  yearly: {
    amount: config.RAZORPAY_PREMIUM_YEARLY_AMOUNT,
    currency: "INR",
    durationDays: 365,
    label: "Yearly",
    plan: "yearly"
  }
};

const getConfiguredPlans = () =>
  Object.values(razorpayPlans)
    .filter((plan) => Number.isInteger(plan.amount) && Number(plan.amount) > 0)
    .map((plan) => ({
      amount: plan.amount,
      currency: plan.currency,
      displayPrice: `₹${(Number(plan.amount) / 100).toLocaleString("en-IN")}`,
      label: plan.label,
      plan: plan.plan
    }));

export const getRazorpayPaymentStatus = () => {
  const plans = getConfiguredPlans();
  const paymentAvailable = Boolean(
    config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET && plans.length
  );

  return {
    paymentAvailable,
    plans: paymentAvailable ? plans : [],
    provider: "razorpay"
  };
};

const fetchRazorpayPaymentLinkStatus = async (paymentLinkId: string) => {
  const credentials = requireRazorpayConfig();
  const response = await fetch(`${razorpayApiBaseUrl}/payment_links/${paymentLinkId}`, {
    headers: {
      Authorization: getBasicAuthHeader(credentials)
    },
    method: "GET"
  });

  const payload = (await response.json().catch(() => null)) as {
    id?: string;
    payments?: Array<{ payment_id?: string }>;
    status?: string;
  } | null;

  if (!response.ok || !payload?.id || !payload?.status) {
    logger.warn("Razorpay payment status lookup failed", {
      paymentLinkId,
      status: response.status
    });
    throw new RazorpayVerificationError();
  }

  return {
    paymentId: payload.payments?.[0]?.payment_id || null,
    paymentLinkId: payload.id,
    status: payload.status
  };
};

const requireRazorpayConfig = () => {
  if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
    throw new RazorpayUnavailableError();
  }

  return {
    keyId: config.RAZORPAY_KEY_ID,
    keySecret: config.RAZORPAY_KEY_SECRET
  };
};

const getPlanConfig = (plan: PremiumPlan) => {
  const planConfig = razorpayPlans[plan];

  if (!planConfig?.amount) {
    throw new RazorpayUnavailableError();
  }

  return planConfig as RazorpayPlanConfig & { amount: number };
};

const getBasicAuthHeader = ({ keyId, keySecret }: { keyId: string; keySecret: string }) =>
  `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

const createHmacDigest = (payload: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");

const serializeFirestoreValue = (value: unknown) => {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return value ?? null;
};

const getFirestoreTimestampMs = (value: unknown) => {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  return 0;
};

const signaturesMatch = (expectedSignature: string, receivedSignature?: string) => {
  if (!receivedSignature) {
    return false;
  }

  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(receivedSignature);

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

const getExpirationDate = (plan: RazorpayPlanConfig, now = new Date()) =>
  new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString();

const grantPremiumForPayment = async ({
  orderId,
  paymentId,
  plan,
  uid
}: {
  orderId?: string | null;
  paymentId?: string | null;
  plan: PremiumPlan;
  uid: string;
}) =>
  writeServerVerifiedSubscription(uid, {
    expirationDate: getExpirationDate(razorpayPlans[plan]),
    orderId,
    paymentId,
    plan
  });

export const createRazorpayPaymentLink = async ({ email, plan, uid }: CreatePaymentLinkInput) => {
  const credentials = requireRazorpayConfig();
  const planConfig = getPlanConfig(plan);
  const referenceId = crypto.randomUUID();
  const callbackUrl = config.APP_PUBLIC_URL
    ? `${config.APP_PUBLIC_URL.replace(/\/$/, "")}/payments/razorpay/callback`
    : undefined;

  const response = await fetch(`${razorpayApiBaseUrl}/payment_links`, {
    body: JSON.stringify({
      amount: planConfig.amount,
      callback_method: callbackUrl ? "get" : undefined,
      callback_url: callbackUrl,
      currency: planConfig.currency,
      customer: email ? { email } : undefined,
      description: `IntervueAI Premium ${planConfig.label}`,
      notes: {
        plan
      },
      notify: {
        email: Boolean(email),
        sms: false
      },
      reference_id: referenceId
    }),
    headers: {
      Authorization: getBasicAuthHeader(credentials),
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  const payload = (await response.json().catch(() => null)) as {
    amount?: number;
    currency?: string;
    id?: string;
    short_url?: string;
  } | null;

  if (!response.ok || !payload?.id || !payload.short_url) {
    logger.warn("Razorpay payment link creation failed", {
      status: response.status
    });
    throw new RazorpayUnavailableError();
  }

  await getFirebaseAdmin()
    .firestore()
    .collection(paymentsCollection)
    .doc(payload.id)
    .set({
      amount: payload.amount || planConfig.amount,
      createdAt: getFirebaseAdmin().firestore.FieldValue.serverTimestamp(),
      currency: payload.currency || planConfig.currency,
      paymentLinkId: payload.id,
      plan,
      provider: "razorpay",
      referenceId,
      status: "created",
      uid
    });

  return {
    amount: payload.amount || planConfig.amount,
    currency: payload.currency || planConfig.currency,
    keyId: credentials.keyId,
    orderId: payload.id,
    paymentLinkId: payload.id,
    paymentUrl: payload.short_url,
    plan,
    provider: "razorpay",
    referenceId
  };
};

const markPaymentVerified = async ({
  paymentId,
  paymentLinkId,
  status
}: {
  paymentId?: string | null;
  paymentLinkId: string;
  status: string;
}) => {
  const firebaseAdmin = getFirebaseAdmin();

  await firebaseAdmin
    .firestore()
    .collection(paymentsCollection)
    .doc(paymentLinkId)
    .set(
      {
        paymentId: paymentId || null,
        status,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
};

export const verifyRazorpayPayment = async (uid: string, input: VerifyPaymentInput) => {
  const credentials = requireRazorpayConfig();
  const { paymentId, paymentLinkId, paymentLinkReferenceId, paymentLinkStatus, signature } = input;

  if (!paymentId || !paymentLinkId || !paymentLinkReferenceId || !paymentLinkStatus || !signature) {
    throw new RazorpayVerificationError();
  }

  const expectedSignature = createHmacDigest(
    `${paymentLinkId}|${paymentLinkReferenceId}|${paymentLinkStatus}|${paymentId}`,
    credentials.keySecret
  );

  if (!signaturesMatch(expectedSignature, signature) || paymentLinkStatus !== "paid") {
    throw new RazorpayVerificationError();
  }

  const paymentSnapshot = await getFirebaseAdmin()
    .firestore()
    .collection(paymentsCollection)
    .doc(paymentLinkId)
    .get();

  const paymentData = paymentSnapshot.data();

  if (!paymentSnapshot.exists || paymentData?.uid !== uid) {
    throw new RazorpayVerificationError();
  }

  const plan = paymentData.plan === "yearly" ? "yearly" : "monthly";
  await markPaymentVerified({
    paymentId,
    paymentLinkId,
    status: "verified"
  });

  return grantPremiumForPayment({
    orderId: paymentLinkId,
    paymentId,
    plan,
    uid
  });
};

export const verifyRazorpayWebhookSignature = (rawBody: string, signature?: string) => {
  if (!config.RAZORPAY_WEBHOOK_SECRET || !signature) {
    return false;
  }

  return signaturesMatch(createHmacDigest(rawBody, config.RAZORPAY_WEBHOOK_SECRET), signature);
};

const getLatestStoredPaymentForUser = async (uid: string): Promise<StoredPaymentRecord | null> => {
  const snapshot = await getFirebaseAdmin()
    .firestore()
    .collection(paymentsCollection)
    .where("uid", "==", uid)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const latestPayment = snapshot.docs
    .map((doc) => doc.data() as StoredPaymentRecord)
    .filter((doc) => typeof doc.paymentLinkId === "string" && doc.paymentLinkId)
    .sort((left, right) => {
      const rightTimestamp = Math.max(
        getFirestoreTimestampMs(right.updatedAt),
        getFirestoreTimestampMs(right.createdAt)
      );
      const leftTimestamp = Math.max(
        getFirestoreTimestampMs(left.updatedAt),
        getFirestoreTimestampMs(left.createdAt)
      );

      return rightTimestamp - leftTimestamp;
    })[0];

  return latestPayment || null;
};

export const getLatestRazorpayPaymentForUser = async (uid: string) => {
  const latestPayment = await getLatestStoredPaymentForUser(uid);

  if (!latestPayment) {
    return null;
  }

  let status = latestPayment.status || "created";
  let paymentId = latestPayment.paymentId || null;

  if (
    config.RAZORPAY_KEY_ID &&
    config.RAZORPAY_KEY_SECRET &&
    !["verified", "webhook_verified", "reconciled_paid", "cancelled", "expired", "failed"].includes(
      status
    )
  ) {
    try {
      const remotePayment = await fetchRazorpayPaymentLinkStatus(latestPayment.paymentLinkId);
      paymentId = remotePayment.paymentId || paymentId;

      if (remotePayment.status === "paid") {
        status = "reconciled_paid";
        await markPaymentVerified({
          paymentId,
          paymentLinkId: latestPayment.paymentLinkId,
          status
        });
        await grantPremiumForPayment({
          orderId: latestPayment.paymentLinkId,
          paymentId,
          plan: latestPayment.plan,
          uid
        });
      } else if (["cancelled", "expired", "failed"].includes(remotePayment.status)) {
        status = remotePayment.status;
        await markPaymentVerified({
          paymentId,
          paymentLinkId: latestPayment.paymentLinkId,
          status
        });
      } else {
        status = remotePayment.status;
      }
    } catch (error) {
      logger.warn("Razorpay payment reconciliation skipped", {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        paymentLinkId: latestPayment.paymentLinkId
      });
    }
  }

  return {
    createdAt: serializeFirestoreValue(latestPayment.createdAt),
    paymentId,
    paymentLinkId: latestPayment.paymentLinkId,
    plan: latestPayment.plan,
    status,
    updatedAt: serializeFirestoreValue(latestPayment.updatedAt)
  };
};

export const handleRazorpayWebhook = async (body: unknown) => {
  const event = body as {
    event?: string;
    payload?: {
      payment_link?: {
        entity?: {
          id?: string;
          notes?: {
            plan?: string;
            uid?: string;
          };
          status?: string;
        };
      };
      payment?: {
        entity?: {
          id?: string;
        };
      };
    };
  };

  if (event.event !== "payment_link.paid") {
    return { ignored: true };
  }

  const paymentLink = event.payload?.payment_link?.entity;
  const paymentLinkId = paymentLink?.id;
  const paymentId = event.payload?.payment?.entity?.id || null;

  if (!paymentLinkId || paymentLink.status !== "paid") {
    logger.warn("Razorpay webhook missing required payment link fields");
    return { ignored: true };
  }

  const paymentSnapshot = await getFirebaseAdmin()
    .firestore()
    .collection(paymentsCollection)
    .doc(paymentLinkId)
    .get();
  const paymentData = paymentSnapshot.data();
  const uid = typeof paymentData?.uid === "string" ? paymentData.uid : "";
  const plan = paymentData?.plan === "yearly" ? "yearly" : "monthly";

  if (!paymentSnapshot.exists || !uid) {
    logger.warn("Razorpay webhook payment record not found", {
      paymentLinkId
    });
    return { ignored: true };
  }

  await markPaymentVerified({
    paymentId,
    paymentLinkId,
    status: "webhook_verified"
  });

  await grantPremiumForPayment({
    orderId: paymentLinkId,
    paymentId,
    plan,
    uid
  });

  return { ignored: false };
};
