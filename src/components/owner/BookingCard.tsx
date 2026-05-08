"use client";

import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import type { Booking } from "@/types";
import { DamageReview } from "@/components/owner/DamageReview";

export function BookingCard({
  booking,
  ownerId,
}: {
  booking: Booking & { bookingId: string };
  ownerId: string;
}) {
  const start = booking.startTime?.toDate?.() ?? null;
  const end = booking.endTime?.toDate?.() ?? null;

  const overstay = booking.status === "overstaying";
  const initials =
    booking.driverName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "D";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-950">
            {booking.driverName}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {booking.spotTitle} • {booking.spotAddress}
          </div>
          <div className="mt-2 text-xs text-zinc-600">
            {start ? start.toLocaleString() : "—"} →{" "}
            {end ? end.toLocaleString() : "—"}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
              ₹{booking.totalAmount} • {booking.durationHours}h
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
              {booking.status}
            </span>
            {overstay ? (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                Overstaying
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
            {initials}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
          onClick={async () => {
            try {
              await updateDoc(doc(db, "users", booking.driverId), {
                blockedBy: arrayUnion(ownerId),
              });
              toast.success("Driver blocked for your listings.");
            } catch {
              toast.error("Could not block driver. Try again.");
            }
          }}
        >
          Block Driver
        </button>
      </div>
      {booking.damageReport ? (
        <div className="mt-4">
          <DamageReview booking={booking} />
        </div>
      ) : null}
    </div>
  );
}

