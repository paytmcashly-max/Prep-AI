import { getFirebaseAdmin } from "../firebaseAdmin.js";

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

const usageLimitsCollection = "usageLimits";

const getDailyPeriodKey = () => new Date().toISOString().slice(0, 10);

const getMonthlyPeriodKey = () => new Date().toISOString().slice(0, 7);

const getUsageDocumentId = (uid: string, type: UsageType, period: string) =>
  `${uid}_${type}_${period}`;

const consumeUsage = async (uid: string, config: UsageLimitConfig) => {
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

export const trackInterviewQuestionUsage = async (uid: string) => {
  await consumeUsage(uid, {
    limit: 5,
    period: getDailyPeriodKey(),
    type: "interview"
  });
};

export const trackAnswerEvaluationUsage = async (uid: string) => {
  await consumeUsage(uid, {
    limit: 5,
    period: getDailyPeriodKey(),
    type: "evaluation"
  });
};

export const trackResumeAnalysisUsage = async (uid: string) => {
  await consumeUsage(uid, {
    limit: 1,
    period: getMonthlyPeriodKey(),
    type: "resume"
  });
};
