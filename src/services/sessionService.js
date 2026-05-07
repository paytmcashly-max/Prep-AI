import { addDoc, collection, getDocs, limit, orderBy, query } from "firebase/firestore";

import { auth, firestore } from "./firebaseConfig";
import { useUserStore } from "../store/userStore";

const getCurrentUid = () => {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Please log in to view your interview progress.");
  }

  return uid;
};

const getSessionsCollection = (uid) => collection(firestore, "users", uid, "sessions");

export const normalizeSessionDate = (dateValue) => {
  if (!dateValue) {
    return new Date();
  }

  if (typeof dateValue.toDate === "function") {
    return dateValue.toDate();
  }

  if (dateValue instanceof Date) {
    return dateValue;
  }

  return new Date(dateValue);
};

export const getDateKey = (dateValue) => {
  const date = normalizeSessionDate(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const saveMockInterviewSession = async ({
  category,
  score,
  questionsAttempted,
  jobRole
}) => {
  const uid = getCurrentUid();
  const sessionScore = Number(score || 0);

  return addDoc(getSessionsCollection(uid), {
    category: category || "HR",
    score: Number(sessionScore.toFixed(1)),
    questionsAttempted: Number(questionsAttempted || 0),
    date: new Date(),
    jobRole: jobRole || useUserStore.getState().profile.jobRole || "Not specified"
  });
};

export const fetchUserSessions = async ({ maxCount } = {}) => {
  const uid = getCurrentUid();
  const queryConstraints = [orderBy("date", "desc")];

  if (maxCount) {
    queryConstraints.push(limit(maxCount));
  }

  const sessionsQuery = query(getSessionsCollection(uid), ...queryConstraints);
  const snapshot = await getDocs(sessionsQuery);

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    const date = normalizeSessionDate(data.date);

    return {
      id: docSnapshot.id,
      ...data,
      score: Number(data.score || 0),
      questionsAttempted: Number(data.questionsAttempted || 0),
      date
    };
  });
};

export const calculateAverageScore = (sessions) => {
  if (!sessions.length) {
    return 0;
  }

  const total = sessions.reduce((sum, session) => sum + Number(session.score || 0), 0);
  return Number((total / sessions.length).toFixed(1));
};

export const calculateCurrentStreak = (sessions) => {
  const practicedDays = new Set(sessions.map((session) => getDateKey(session.date)));
  let streak = 0;
  const cursor = new Date();

  if (!practicedDays.has(getDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (practicedDays.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const getLastSevenDayScores = (sessions) => {
  const scoresByDay = sessions.reduce((days, session) => {
    const dateKey = getDateKey(session.date);

    if (!days[dateKey]) {
      days[dateKey] = [];
    }

    days[dateKey].push(Number(session.score || 0));
    return days;
  }, {});

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dateKey = getDateKey(date);
    const dayScores = scoresByDay[dateKey] || [];
    const score = dayScores.length
      ? dayScores.reduce((sum, current) => sum + current, 0) / dayScores.length
      : 0;

    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      practiced: dayScores.length > 0,
      score: Number(score.toFixed(1))
    };
  });
};
