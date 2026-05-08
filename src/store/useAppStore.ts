import type { User as FirebaseUser } from "firebase/auth";
import { create } from "zustand";

export type UserRole = "driver" | "owner";

export type ActiveBooking = {
  bookingId: string;
} | null;

type AppState = {
  user: FirebaseUser | null;
  userRole: UserRole | null;
  activeBooking: ActiveBooking;
  setUser: (user: FirebaseUser | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setActiveBooking: (booking: ActiveBooking) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: null,
  userRole: null,
  activeBooking: null,
  setUser: (user) => set({ user }),
  setUserRole: (userRole) => set({ userRole }),
  setActiveBooking: (activeBooking) => set({ activeBooking }),
}));


