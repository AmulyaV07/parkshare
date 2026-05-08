import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Booking,
  BookingStatus,
  ConflictRequest,
  ParkingSpot,
  UserDoc,
} from "@/types";

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function createUser(user: {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
}) {
  const ref = doc(db, "users", user.uid);
  await setDoc(
    ref,
    {
      uid: user.uid,
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      behaviorScore: 100,
      blockedBy: [],
    },
    { merge: true },
  );
}

export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserDoc;
}

export async function createParkingSpot(spot: ParkingSpot) {
  const spotsRef = collection(db, "parkingSpots");
  const ref = await addDoc(spotsRef, {
    ...spot,
    isActive: spot.isActive ?? true,
    totalBookings: spot.totalBookings ?? 0,
    averageRating: spot.averageRating ?? 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export type ParkingSpotFilters = Partial<{
  ownerId: string;
  isActive: boolean;
  isCovered: boolean;
  hasEVCharging: boolean;
  hasCCTV: boolean;
  vehicleType: string;
  maxHourlyRate: number;
}>;

export async function getParkingSpots(filters: ParkingSpotFilters = {}) {
  const spotsCol = collection(db, "parkingSpots");
  const constraints = [];

  if (typeof filters.ownerId === "string") {
    constraints.push(where("ownerId", "==", filters.ownerId));
  }
  if (typeof filters.isActive === "boolean") {
    constraints.push(where("isActive", "==", filters.isActive));
  } else {
    constraints.push(where("isActive", "==", true));
  }
  if (typeof filters.isCovered === "boolean") {
    constraints.push(where("isCovered", "==", filters.isCovered));
  }
  if (typeof filters.hasEVCharging === "boolean") {
    constraints.push(where("hasEVCharging", "==", filters.hasEVCharging));
  }
  if (typeof filters.hasCCTV === "boolean") {
    constraints.push(where("hasCCTV", "==", filters.hasCCTV));
  }
  if (typeof filters.vehicleType === "string") {
    constraints.push(where("vehicleTypes", "array-contains", filters.vehicleType));
  }
  if (typeof filters.maxHourlyRate === "number") {
    constraints.push(where("baseHourlyRate", "<=", filters.maxHourlyRate));
  }

  const q = query(spotsCol, ...constraints);
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ ...(d.data() as ParkingSpot), spotId: d.id }));
}

export async function getNearbySpots(
  lat: number,
  lng: number,
  radiusKm: number,
) {
  const all = await getParkingSpots({ isActive: true });
  return all
    .map((s) => ({
      ...s,
      distanceKm: haversineKm(lat, lng, s.latitude, s.longitude),
    }))
    .filter((s) => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function createBooking(booking: Booking) {
  const ref = doc(db, "bookings", booking.bookingId);
  await setDoc(
    ref,
    {
      ...booking,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
  return booking.bookingId;
}

export async function getBooking(bookingId: string) {
  const snap = await getDoc(doc(db, "bookings", bookingId));
  if (!snap.exists()) return null;
  return snap.data() as Booking;
}

export async function getActiveBookingForDriver(driverId: string) {
  const q = query(
    collection(db, "bookings"),
    where("driverId", "==", driverId),
    where("status", "in", ["upcoming", "active", "overstaying"]),
    orderBy("startTime", "desc"),
    limit(1),
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  const d = snaps.docs[0];
  return { ...(d.data() as Booking), bookingId: d.id };
}

export async function getBookingsForSpot(spotId: string) {
  const q = query(collection(db, "bookings"), where("spotId", "==", spotId));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ ...(d.data() as Booking), bookingId: d.id }));
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  await updateDoc(doc(db, "bookings", bookingId), { status });
}

export async function createConflictRequest(conflict: ConflictRequest) {
  const ref = await addDoc(collection(db, "conflictRequests"), {
    ...conflict,
    createdAt: serverTimestamp(),
    resolvedAt: null,
  });
  return ref.id;
}

export async function updateConflictRequest(
  conflictId: string,
  data: Partial<ConflictRequest>,
) {
  await updateDoc(doc(db, "conflictRequests", conflictId), data as DocumentData);
}

