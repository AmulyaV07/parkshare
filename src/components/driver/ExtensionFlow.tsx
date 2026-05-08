"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Booking, ConflictStatus } from "@/types";

type ConflictAi = {
  compensationAmount: number;
  compensationReason: string;
  alternateSpotRecommendation: string;
  urgencyLevel: "low" | "medium" | "high";
  resolutionStrategy: string;
};

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

export function ExtensionFlow({
  booking,
  open,
  onClose,
}: {
  booking: (Booking & { bookingId: string }) | null;
  open: boolean;
  onClose: () => void;
}) {
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ai, setAi] = useState<ConflictAi | null>(null);

  if (!open || !booking) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-3 sm:items-center">
      <div className="pointer-events-auto w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-zinc-950">Extend booking</div>
            <div className="mt-1 text-xs text-zinc-500">{booking.spotTitle}</div>
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

        <div className="mt-4 flex items-center gap-2">
          {[1, 2].map((h) => (
            <button
              key={h}
              type="button"
              className={[
                "rounded-xl px-3 py-2 text-sm font-semibold",
                hours === h
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
              ].join(" ")}
              onClick={() => setHours(h)}
            >
              +{h}h
            </button>
          ))}
        </div>

        {message ? <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm">{message}</div> : null}

        {ai ? (
          <div className="mt-4 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
            <div>
              <span className="font-semibold">Compensation: </span>₹{ai.compensationAmount}
            </div>
            <div>{ai.compensationReason}</div>
            <div>{ai.alternateSpotRecommendation}</div>
            <div className="text-xs italic text-zinc-600">{ai.resolutionStrategy}</div>
          </div>
        ) : null}

        <button
          type="button"
          className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          disabled={loading}
          onClick={async () => {
            try {
              setLoading(true);
              setMessage(null);
              setAi(null);

              const currentStart = booking.startTime.toDate();
              const currentEnd = booking.endTime.toDate();
              const requestedEnd = new Date(currentEnd.getTime() + hours * 60 * 60 * 1000);

              const q = query(
                collection(db, "bookings"),
                where("spotId", "==", booking.spotId),
                limit(50),
              );
              const snaps = await getDocs(q);
              const others = snaps.docs
                .map((d) => ({ ...(d.data() as Booking), bookingId: d.id }))
                .filter(
                  (b) =>
                    b.bookingId !== booking.bookingId &&
                    ["upcoming", "active", "overstaying"].includes(b.status),
                );

              const conflict = others.find((b) => {
                const bs = b.startTime?.toDate?.();
                const be = b.endTime?.toDate?.();
                if (!bs || !be) return false;
                return overlaps(currentStart, requestedEnd, bs, be);
              });

              if (!conflict) {
                const extra = Math.round(booking.baseRate * booking.aiSurgeMultiplier * hours);
                await updateDoc(doc(db, "bookings", booking.bookingId), {
                  endTime: Timestamp.fromDate(requestedEnd),
                  durationHours: booking.durationHours + hours,
                  totalAmount: booking.totalAmount + extra,
                  extensionRequests: [
                    ...(booking.extensionRequests ?? []),
                    {
                      requestedAt: Timestamp.now(),
                      extensionHours: hours,
                      status: "approved",
                      aiSummary: "No conflicting booking in requested window.",
                    },
                  ],
                });
                toast.success(`Extension approved! ₹${extra} charged.`);
                onClose();
                return;
              }

              const nearbySpots = [
                {
                  spotId: conflict.spotId,
                  title: conflict.spotTitle,
                  address: conflict.spotAddress,
                },
              ];

              const aiRes = await fetch("/api/ai/conflict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  currentBookingId: booking.bookingId,
                  nextBookingId: conflict.bookingId,
                  spotId: booking.spotId,
                  extensionHours: hours,
                  nearbySpots,
                }),
              });
              const aiJson = (await aiRes.json()) as ConflictAi | { error?: string };
              if (!aiRes.ok) {
                throw new Error("error" in aiJson && aiJson.error ? aiJson.error : "Conflict AI failed");
              }
              setAi(aiJson as ConflictAi);
              setMessage("Requesting extension from next driver...");

              const conflictStatus: ConflictStatus = "pending";
              await addDoc(collection(db, "conflictRequests"), {
                currentBookingId: booking.bookingId,
                nextBookingId: conflict.bookingId,
                currentDriverId: booking.driverId,
                nextDriverId: conflict.driverId,
                spotId: booking.spotId,
                extensionHours: hours,
                status: conflictStatus,
                compensationOffer: (aiJson as ConflictAi).compensationAmount,
                alternateSpots: [],
                createdAt: Timestamp.now(),
                resolvedAt: null,
              });

              await new Promise((resolve) => setTimeout(resolve, 5000));
              const accepted = Math.random() < 0.7;
              if (accepted) {
                await updateDoc(doc(db, "bookings", booking.bookingId), {
                  endTime: Timestamp.fromDate(requestedEnd),
                  durationHours: booking.durationHours + hours,
                  status: "active",
                });
                toast.success("Extension accepted. Compensation credited (mock).");
                onClose();
              } else {
                setMessage("Extension denied - please vacate on time.");
                toast.error("Next driver rejected extension request.");
              }
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Extension failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Processing..." : "Request Extension"}
        </button>
      </div>
    </div>
  );
}

