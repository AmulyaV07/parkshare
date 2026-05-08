"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/useAppStore";
import type { ParkingSpot } from "@/types";

export function BookingConfirmation({
  open,
  onClose,
  spot,
  durationHours,
  aiFinalPricePerHour,
  aiSurgeMultiplier,
}: {
  open: boolean;
  onClose: () => void;
  spot: (ParkingSpot & { spotId: string }) | null;
  durationHours: number;
  aiFinalPricePerHour: number | null;
  aiSurgeMultiplier: number;
}) {
  const user = useAppStore((s) => s.user);
  const setActiveBooking = useAppStore((s) => s.setActiveBooking);
  const [loading, setLoading] = useState(false);

  const baseRate = spot?.baseHourlyRate ?? 0;
  const perHour = aiFinalPricePerHour ?? baseRate;

  const total = useMemo(() => {
    if (!Number.isFinite(perHour) || perHour <= 0) return 0;
    return Math.round(perHour * Math.max(1, durationHours));
  }, [durationHours, perHour]);

  if (!open || !spot) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-center p-3">
      <div className="pointer-events-auto w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-zinc-950">
              Confirm booking
            </div>
            <div className="mt-1 truncate text-xs text-zinc-500">
              {spot.title} • {spot.address}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            disabled={loading}
          >
            Close
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-zinc-600">Duration</div>
              <div className="font-semibold text-zinc-900">{durationHours}h</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-zinc-600">Rate</div>
              <div className="font-semibold text-zinc-900">₹{perHour}/hr</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-zinc-600">Total (mock)</div>
              <div className="text-base font-semibold text-zinc-950">₹{total}</div>
            </div>
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={loading || !user}
            onClick={async () => {
              try {
                if (!user) {
                  toast.error("Please sign in first");
                  return;
                }
                setLoading(true);
                const res = await fetch("/api/bookings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    spotId: spot.spotId,
                    driverId: user.uid,
                    driverName: user.displayName ?? "",
                    durationHours: Math.max(1, durationHours),
                    baseRate: baseRate,
                    aiSurgeMultiplier: Math.max(1, aiSurgeMultiplier || 1),
                    totalAmount: total,
                  }),
                });
                const json = (await res.json()) as
                  | { bookingId: string }
                  | { error?: string };
                if (!res.ok) {
                  throw new Error("error" in json && json.error ? json.error : "Booking failed");
                }
                const bookingId = (json as { bookingId: string }).bookingId;
                setActiveBooking({ bookingId });
                toast.success("Booking confirmed (mock paid)");
                onClose();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Booking failed");
              } finally {
                setLoading(false);
              }
            }}
          >
            {user ? (loading ? "Confirming…" : "Confirm & Pay (Mock)") : "Sign in to book"}
          </button>
        </div>
      </div>
    </div>
  );
}

