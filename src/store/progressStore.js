import { create } from "zustand";

const defaultProgressState = {
  streak: 0,
  totalQuestions: 0,
  history: [],
  sessions: [],
  hasLoadedSessions: false,
  sessionsUpdatedAt: null
};

export const useProgressStore = create((set) => ({
  ...defaultProgressState,
  addPracticeResult: (result) =>
    set((state) => ({
      totalQuestions: state.totalQuestions + 1,
      history: [result, ...state.history].slice(0, 50)
    })),
  setSessions: (sessions) =>
    set({
      sessions,
      hasLoadedSessions: true,
      sessionsUpdatedAt: new Date().toISOString()
    }),
  resetProgress: () => set({ ...defaultProgressState }),
  updateStreak: (streak) => set({ streak })
}));
