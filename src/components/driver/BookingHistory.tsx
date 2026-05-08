"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import type { Booking } from "@/types";
import { DamageClaim } from "@/components/driver/DamageClaim";
import { Skeleton } from "@/components/ui/Skeleton";

function statusChip(status: Booking["status"]) {
  if (status === "completed") return "bg-emerald-600 text-white";
  if (status === "cancelled") return "bg-zinc-500 text-white";
  if (status === "overstaying") return "bg-red-600 text-white";
  if (status === "active") return "bg-blue-600 text-white";
  return "bg-amber-500 text-white";
}

export function BookingHistory() {
  const user = useAppStore((s) => s.user);
  const [rows, setRows] = useState<(Booking & { bookingId: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimBookingId, setClaimBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "bookings"),
          where("driverId", "==", user.uid),
        );
        const snaps = await getDocs(q);
        const data = snaps.docs.map((d) => ({ ...(d.data() as Booking), bookingId: d.id }));
        data.sort((a, b) => {
          const at = a.createdAt?.toMillis?.() ?? a.startTime?.toMillis?.() ?? 0;
          const bt = b.createdAt?.toMillis?.() ?? b.startTime?.toMillis?.() ?? 0;
          return bt - at;
        });
        setRows(data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-950">Booking history</div>
        {loading ? <div className="text-xs text-zinc-500">Loading…</div> : null}
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center">
          <svg
            viewBox="0 0 120 80"
            className="mx-auto h-16 w-24 text-zinc-400"
            fill="none"
            aria-hidden
          >
            <rect x="10" y="10" width="100" height="60" rx="10" stroke="currentColor" />
            <path d="M25 30h70M25 45h45" stroke="currentColor" />
          </svg>
          <div className="mt-2 text-sm font-semibold text-zinc-900">No bookings yet</div>
          <div className="text-xs text-zinc-600">Book a spot from the map to get started.</div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {rows.map((b) => (
            <div
              key={b.bookingId}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-950">
                    {b.spotTitle}
                  </div>
                  <div className="mt-1 truncate text-xs text-zinc-500">{b.spotAddress}</div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusChip(
                    b.status,
                  )}`}
                >
                  {b.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-700">
                <span className="rounded-full bg-white px-2.5 py-1">
                  ₹{b.totalAmount}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1">{b.durationHours}h</span>
                <span className="rounded-full bg-white px-2.5 py-1">
                  {b.paymentStatus}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {b.entryVideoURL ? (
                  <a
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    href={b.entryVideoURL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Entry video
                  </a>
                ) : null}
                {b.exitVideoURL ? (
                  <a
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    href={b.exitVideoURL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Exit video
                  </a>
                ) : null}
                <button
                  type="button"
                  className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => setClaimBookingId(b.bookingId)}
                >
                  Raise damage claim
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <DamageClaim
        booking={rows.find((r) => r.bookingId === claimBookingId) ?? null}
        open={!!claimBookingId}
        onClose={() => setClaimBookingId(null)}
      />
    </div>
  );
}

