import { getFirebaseAdmin } from "../firebaseAdmin.js";
import { logger } from "../logger.js";

export class UsageLimitError extends Error {
  constructor() {
    super("Usage limit reached");
    this.name = "UsageLimitError";
  }
}

type UsageType = "interview" | "evaluation" | "resume";

type UsageLimitConfig = {
  limit: number;
  period: string;
  type: UsageType;
};

type UsageQuotaStatus = {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
  isPremium: boolean;
};

const usageLimitsCollection = "usageLimits";
const subscriptionCollectionPath = "subscription";
const subscriptionDocumentId = "main";
const quotaResetTimeZone = "Asia/Kolkata";
const kolkataOffsetMs = 5.5 * 60 * 60 * 1000;
const dayMs = 24 * 60 * 60 * 1000;
const dailyInterviewLimit = 5;
const dailyEvaluationLimit = 5;
const threeDayResumeLimit = 1;
const resumePeriodDays = 3;

const getTimeZoneDateParts = (date: Date, timeZone: string) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric"
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  ) as {
    day: string;
    month: string;
    year: string;
  };

export const getDailyPeriodKey = (date = new Date(), timeZone = quotaResetTimeZone) => {
  const parts = getTimeZoneDateParts(date, timeZone);

  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const getDailyResetAt = (date = new Date()) => {
  const kolkataDate = new Date(date.getTime() + kolkataOffsetMs);
  const resetAtUtc =
    Date.UTC(
      kolkataDate.getUTCFullYear(),
      kolkataDate.getUTCMonth(),
      kolkataDate.getUTCDate() + 1
    ) - kolkataOffsetMs;

  return new Date(resetAtUtc).toISOString();
};

const getKolkataDayIndex = (date: Date) => {
  const kolkataDate = new Date(date.getTime() + kolkataOffsetMs);
  return Math.floor(
    Date.UTC(kolkataDate.getUTCFullYear(), kolkataDate.getUTCMonth(), kolkataDate.getUTCDate()) /
      dayMs
  );
};

const formatUtcDayIndex = (dayIndex: number) => {
  const date = new Date(dayIndex * dayMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getThreeDayResumePeriodKey = (date = new Date()) => {
  const dayIndex = getKolkataDayIndex(date);
  const periodStartDayIndex = Math.floor(dayIndex / resumePeriodDays) * resumePeriodDays;

  return formatUtcDayIndex(periodStartDayIndex);
};

export const getThreeDayResumeResetAt = (date = new Date()) => {
  const dayIndex = getKolkataDayIndex(date);
  const nextPeriodStartDayIndex =
    Math.floor(dayIndex / resumePeriodDays) * resumePeriodDays + resumePeriodDays;
  const resetAtUtc = nextPeriodStartDayIndex * dayMs - kolkataOffsetMs;

  return new Date(resetAtUtc).toISOString();
};

const getUsageDocumentId = (uid: string, type: UsageType, period: string) =>
  `${uid}_${type}_${period}`;

type SubscriptionStatusData = {
  expirationDate?: unknown;
  isPremium?: unknown;
};

export const isSubscriptionActiveFromData = (
  data: SubscriptionStatusData | undefined,
  now = new Date()
) => {
  if (data?.isPremium !== true) {
    return false;
  }

  if (!data.expirationDate) {
    return true;
  }

  if (typeof data.expirationDate !== "string") {
    return false;
  }

  const expiresAt = new Date(data.expirationDate);

  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }

  return expiresAt.getTime() > now.getTime();
};

export const hasActivePremiumSubscription = async (uid: string) => {
  try {
    const firestore = getFirebaseAdmin().firestore();
    const subscriptionSnapshot = await firestore
      .collection("users")
      .doc(uid)
      .collection(subscriptionCollectionPath)
      .doc(subscriptionDocumentId)
      .get();

    if (!subscriptionSnapshot.exists) {
      return false;
    }

    return isSubscriptionActiveFromData(subscriptionSnapshot.data());
  } catch (error) {
    logger.warn("Premium subscription check failed; enforcing free usage limits", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorName: error instanceof Error ? error.name : "UnknownError"
    });
    return false;
  }
};

const consumeUsage = async (uid: string, config: UsageLimitConfig) => {
  const isPremium = await hasActivePremiumSubscription(uid);

  if (isPremium) {
    return;
  }

  const firebaseAdmin = getFirebaseAdmin();
  const firestore = firebaseAdmin.firestore();
  const usageRef = firestore
    .collection(usageLimitsCollection)
    .doc(getUsageDocumentId(uid, config.type, config.period));

  await firestore.runTransaction(async (transaction) => {
    const usageSnapshot = await transaction.get(usageRef);
    const currentCount = usageSnapshot.exists ? Number(usageSnapshot.data()?.count || 0) : 0;

    if (currentCount >= config.limit) {
      throw new UsageLimitError();
    }

    transaction.set(
      usageRef,
      {
        uid,
        type: config.type,
        period: config.period,
        count: currentCount + 1,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });
};

const readUsageCount = async (uid: string, type: UsageType, period: string) => {
  const firestore = getFirebaseAdmin().firestore();
  const usageSnapshot = await firestore
    .collection(usageLimitsCollection)
    .doc(getUsageDocumentId(uid, type, period))
    .get();

  if (!usageSnapshot.exists) {
    return 0;
  }

  return Math.max(0, Number(usageSnapshot.data()?.count || 0));
};

const createQuotaStatus = ({
  isPremium,
  limit,
  resetAt,
  used
}: {
  isPremium: boolean;
  limit: number;
  resetAt: string;
  used: number;
}): UsageQuotaStatus => ({
  isPremium,
  limit,
  remaining: isPremium ? limit : Math.max(0, limit - used),
  resetAt,
  used
});

export const getUsageStatus = async (uid: string, date = new Date()) => {
  const isPremium = await hasActivePremiumSubscription(uid);
  const dailyPeriod = getDailyPeriodKey(date);
  const resumePeriod = getThreeDayResumePeriodKey(date);
  const [interviewUsed, evaluationUsed, resumeUsed] = await Promise.all([
    readUsageCount(uid, "interview", dailyPeriod),
    readUsageCount(uid, "evaluation", dailyPeriod),
    readUsageCount(uid, "resume", resumePeriod)
  ]);

  return {
    isPremium,
    interview: createQuotaStatus({
      isPremium,
      limit: dailyInterviewLimit,
      resetAt: getDailyResetAt(date),
      used: interviewUsed
    }),
    evaluation: createQuotaStatus({
      isPremium,
      limit: dailyEvaluationLimit,
      resetAt: getDailyResetAt(date),
      used: evaluationUsed
    }),
    resume: createQuotaStatus({
      isPremium,
      limit: threeDayResumeLimit,
      resetAt: getThreeDayResumeResetAt(date),
      used: resumeUsed
    })
  };
};

export const trackInterviewQuestionUsage = async (uid: string) => {
  await consumeUsage(uid, {
    limit: dailyInterviewLimit,
    period: getDailyPeriodKey(),
    type: "interview"
  });
};

export const trackAnswerEvaluationUsage = async (uid: string) => {
  await consumeUsage(uid, {
    limit: dailyEvaluationLimit,
    period: getDailyPeriodKey(),
    type: "evaluation"
  });
};

export const trackResumeAnalysisUsage = async (uid: string) => {
  await consumeUsage(uid, {
    limit: threeDayResumeLimit,
    period: getThreeDayResumePeriodKey(),
    type: "resume"
  });
};
