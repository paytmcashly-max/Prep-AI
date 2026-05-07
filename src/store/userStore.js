import { create } from "zustand";

const defaultProfile = {
  name: "",
  fullName: "",
  jobRole: "",
  experienceLevel: "",
  targetCompanies: []
};

export const useUserStore = create((set) => ({
  user: null,
  profile: defaultProfile,
  setUser: (user) => set({ user }),
  updateProfile: (profile) =>
    set((state) => ({
      profile: {
        ...state.profile,
        ...profile
      }
    })),
  resetUser: () => set({ user: null, profile: defaultProfile })
}));
