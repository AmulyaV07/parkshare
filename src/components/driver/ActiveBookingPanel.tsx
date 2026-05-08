"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import type { Booking } from "@/types";
import { ExtensionFlow } from "@/components/driver/ExtensionFlow";
import { OverstayAlert } from "@/components/driver/OverstayAlert";

function statusBadge(endMs: number, nowMs: number, status: Booking["status"]) {
  if (status === "overstaying") return { label: "Overstaying", cls: "bg-red-600 text-white" };
  const minsLeft = (endMs - nowMs) / (1000 * 60);
  if (minsLeft <= 30) return { label: "Ending soon", cls: "bg-amber-500 text-white" };
  return { label: "Active", cls: "bg-emerald-600 text-white" };
}

export function ActiveBookingPanel() {
  const activeBooking = useAppStore((s) => s.activeBooking);
  const clearActiveBooking = useAppStore((s) => s.setActiveBooking);
  const booking = useAppStore((s) => s.activeBookingDoc);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [extensionOpen, setExtensionOpen] = useState(false);

  useEffect(() => {
    if (!activeBooking?.bookingId) return;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeBooking?.bookingId]);

  const endMs = useMemo(() => booking?.endTime?.toMillis?.() ?? null, [booking]);
  const remaining = useMemo(() => {
    if (!endMs) return null;
    const diff = Math.max(0, endMs - nowMs);
    const s = Math.floor(diff / 1000);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:${ss
      .toString()
      .padStart(2, "0")}`;
  }, [endMs, nowMs]);

  if (!booking || !endMs || !activeBooking?.bookingId) return null;
  if (booking.bookingId !== activeBooking.bookingId) return null;

  const badge = statusBadge(endMs, nowMs, booking.status);
  const shouldOverstay = booking.status === "active" && nowMs > endMs;

  return (
    <>
      <OverstayAlert booking={booking} />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3">
        <div className="pointer-events-auto mx-auto w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-base font-semibold text-zinc-950">
                  {booking.spotTitle || "Active booking"}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <div className="mt-1 truncate text-xs text-zinc-500">{booking.spotAddress}</div>
            </div>

            <div className="text-right">
              <div className="text-xs font-semibold text-zinc-600">Time left</div>
              <div className="mt-1 font-mono text-lg font-semibold text-zinc-950">
                {booking.status === "overstaying" ? "00:00:00" : remaining}
              </div>
            </div>
          </div>

          <div className="grid gap-2 px-5 pb-5 pt-4 sm:grid-cols-3">
            <button
              type="button"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              onClick={() => setExtensionOpen(true)}
            >
              Extend booking
            </button>
            <button
              type="button"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  booking.spotAddress || booking.spotTitle || "",
                )}`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              Navigate
            </button>
            <button
              type="button"
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white"
              onClick={async () => {
                try {
                  await updateDoc(doc(db, "bookings", booking.bookingId), {
                    status: "completed",
                  });
                  clearActiveBooking(null);
                  toast.success("Booking ended");
                  toast("Exit video prompt comes in Phase 9");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to end booking");
                }
              }}
            >
              End booking
            </button>
          </div>
        </div>
      </div>
      <ExtensionFlow
        booking={booking}
        open={extensionOpen}
        onClose={() => setExtensionOpen(false)}
      />
      {shouldOverstay ? (
        <OverstayStatusUpdater bookingId={booking.bookingId} />
      ) : null}
    </>
  );
}

function OverstayStatusUpdater({ bookingId }: { bookingId: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      void updateDoc(doc(db, "bookings", bookingId), { status: "overstaying" });
    }, 0);
    return () => clearTimeout(t);
  }, [bookingId]);
  return null;
}

