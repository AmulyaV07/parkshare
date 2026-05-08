import type { User as FirebaseUser } from "firebase/auth";
import { create } from "zustand";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Booking } from "@/types";

export type UserRole = "driver" | "owner";

export type ActiveBooking = {
  bookingId: string;
} | null;

type AppState = {
  user: FirebaseUser | null;
  userRole: UserRole | null;
  activeBooking: ActiveBooking;
  activeBookingDoc: (Booking & { bookingId: string }) | null;
  setUser: (user: FirebaseUser | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setActiveBooking: (booking: ActiveBooking) => void;
  initDriverBookingListener: (driverId: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: null,
  userRole: null,
  activeBooking: null,
  activeBookingDoc: null,
  setUser: (user) => set({ user }),
  setUserRole: (userRole) => set({ userRole }),
  setActiveBooking: (activeBooking) => set({ activeBooking }),
  initDriverBookingListener: () => {},
}));

let unsubActiveBooking: (() => void) | null = null;

export async function initDriverBookingListener(driverId: string | null) {
  if (unsubActiveBooking) {
    unsubActiveBooking();
    unsubActiveBooking = null;
  }

  if (!driverId) {
    useAppStore.setState({ activeBooking: null, activeBookingDoc: null });
    return;
  }

  // Avoid composite index requirement by fetching a small set and filtering client-side.
  const q = query(collection(db, "bookings"), where("driverId", "==", driverId), limit(25));
  const snaps = await getDocs(q);
  const candidates = snaps.docs
    .map((d) => ({ ...(d.data() as Booking), bookingId: d.id }))
    .filter((b) => ["upcoming", "active", "overstaying"].includes(b.status))
    .sort((a, b) => {
      const at = a.startTime?.toMillis?.() ?? 0;
      const bt = b.startTime?.toMillis?.() ?? 0;
      return bt - at;
    });

  const latest = candidates[0] ?? null;
  if (!latest) {
    useAppStore.setState({ activeBooking: null, activeBookingDoc: null });
    return;
  }
  useAppStore.setState({
    activeBooking: { bookingId: latest.bookingId },
    activeBookingDoc: latest,
  });

  const ref = doc(db, "bookings", latest.bookingId);
  unsubActiveBooking = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      useAppStore.setState({ activeBooking: null, activeBookingDoc: null });
      return;
    }
    useAppStore.setState({
      activeBooking: { bookingId: snap.id },
      activeBookingDoc: { ...(snap.data() as Booking), bookingId: snap.id },
    });
  });
}



