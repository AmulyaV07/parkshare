"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { Booking } from "@/types";

export function OverstayAlert({ booking }: { booking: (Booking & { bookingId: string }) | null }) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const bookingId = booking?.bookingId ?? null;

  useEffect(() => {
    if (!bookingId) return;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [bookingId]);

  const endMs = booking?.endTime?.toMillis?.() ?? 0;
  const isOverstaying = !!booking && booking.status === "overstaying" && nowMs > endMs;

  const graceSeconds = useMemo(() => {
    if (!isOverstaying) return 0;
    return Math.max(0, 5 * 60 - Math.floor((nowMs - endMs) / 1000));
  }, [endMs, isOverstaying, nowMs]);

  if (!isOverstaying) return null;

  const penalty = Math.round((booking?.baseRate ?? 0) * 1.5);
  const mm = Math.floor(graceSeconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (graceSeconds % 60).toString().padStart(2, "0");

  return (
    <div className="fixed left-0 right-0 top-0 z-[70] border-b border-red-700 bg-red-600 px-4 py-3 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <span className="font-semibold">Overstay alert:</span> grace timer {mm}:{ss} • Penalty
          ₹{penalty}
        </div>
        <button
          type="button"
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700"
          onClick={() => toast.success("Penalty paid (mock). Please leave now.")}
        >
          Pay Penalty & Leave
        </button>
      </div>
    </div>
  );
}

