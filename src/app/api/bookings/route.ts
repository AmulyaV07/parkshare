import { NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

function parseDateMs(v: unknown): Date | null {
  const n = typeof v === "number" ? v : Number.NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      spotId: string;
      driverId: string;
      driverName: string;
      durationHours: number;
      aiSurgeMultiplier: number;
      baseRate: number;
      totalAmount: number;
      startTimeMs?: number;
    };

    if (!body.spotId || !body.driverId) throw new Error("Missing spotId or driverId");
    if (!Number.isFinite(body.durationHours) || body.durationHours <= 0) {
      throw new Error("Invalid durationHours");
    }

    const start = body.startTimeMs ? parseDateMs(body.startTimeMs) : new Date();
    if (!start) throw new Error("Invalid startTimeMs");
    const end = new Date(start.getTime() + body.durationHours * 60 * 60 * 1000);

    const spotRef = doc(db, "parkingSpots", body.spotId);
    const spotSnap = await getDoc(spotRef);
    if (!spotSnap.exists()) throw new Error("Spot not found");
    const spot = spotSnap.data() as {
      title?: string;
      address?: string;
      ownerId?: string;
      ownerName?: string;
      latitude?: number;
      longitude?: number;
      baseHourlyRate?: number;
      isActive?: boolean;
    };
    if (spot.isActive === false) throw new Error("Spot is not active");

    // Availability check (simple overlap scan).
    const q = query(
      collection(db, "bookings"),
      where("spotId", "==", body.spotId),
      where("status", "in", ["upcoming", "active", "overstaying"]),
    );
    const snaps = await getDocs(q);
    for (const d of snaps.docs) {
      const b = d.data() as { startTime?: Timestamp; endTime?: Timestamp };
      const bs = b.startTime?.toDate?.();
      const be = b.endTime?.toDate?.();
      if (!bs || !be) continue;
      if (overlaps(start, end, bs, be)) {
        throw new Error("Spot is unavailable for the selected time window");
      }
    }

    const bookingRef = doc(collection(db, "bookings"));
    const bookingId = bookingRef.id;

    const baseRate =
      Number.isFinite(body.baseRate) && body.baseRate > 0
        ? body.baseRate
        : Number(spot.baseHourlyRate ?? 0);
    const aiSurgeMultiplier =
      Number.isFinite(body.aiSurgeMultiplier) && body.aiSurgeMultiplier >= 1
        ? body.aiSurgeMultiplier
        : 1;
    const totalAmount =
      Number.isFinite(body.totalAmount) && body.totalAmount > 0
        ? body.totalAmount
        : Math.round(baseRate * aiSurgeMultiplier * body.durationHours);

    await setDoc(
      bookingRef,
      {
        spotId: body.spotId,
        spotTitle: spot.title ?? "",
        spotAddress: spot.address ?? "",
        driverId: body.driverId,
        driverName: body.driverName ?? "",
        ownerId: spot.ownerId ?? "",
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        durationHours: body.durationHours,
        baseRate,
        aiSurgeMultiplier,
        totalAmount,
        status: "active",
        paymentStatus: "mock_paid",
        extensionRequests: [],
        entryVideoURL: null,
        exitVideoURL: null,
        damageClaimStatus: "none",
        damageReport: null,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );

    await updateDoc(spotRef, { totalBookings: increment(1) });

    await createNotification(
      body.driverId,
      "booking_confirmed",
      `Your booking at ${spot.title ?? "this spot"} is confirmed for ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}.`,
      { bookingId, spotId: body.spotId },
    );

    return NextResponse.json({
      bookingId,
      spotId: body.spotId,
      startTimeMs: start.getTime(),
      endTimeMs: end.getTime(),
      totalAmount,
      status: "active",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

