import { create } from "zustand";

interface AuthState {
  userId: number | null;
  setUserId: (id: number | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,

  setUserId: (id) => set({ userId: id }),

  logout: () => {
    localStorage.removeItem("token");
    set({ userId: null });
  },
}));