"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import type { Booking, DamageReport } from "@/types";

function severityCls(v: string) {
  if (v === "severe") return "bg-red-600 text-white";
  if (v === "moderate") return "bg-amber-500 text-white";
  if (v === "minor") return "bg-blue-600 text-white";
  return "bg-emerald-600 text-white";
}

export function DamageClaim({
  booking,
  open,
  onClose,
}: {
  booking: (Booking & { bookingId: string }) | null;
  open: boolean;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DamageReport | null>(null);

  if (!open || !booking) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div className="pointer-events-auto w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-zinc-950">Damage claim</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Close
          </button>
        </div>

        <textarea
          className="mt-4 min-h-24 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe the damage you found"
        />

        <button
          type="button"
          className="mt-3 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={loading || !note.trim()}
          onClick={async () => {
            try {
              setLoading(true);
              setReport(null);
              const res = await fetch("/api/ai/damage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  bookingId: booking.bookingId,
                  entryVideoURL: booking.entryVideoURL,
                  exitVideoURL: booking.exitVideoURL,
                  driverNote: note.trim(),
                }),
              });
              const json = (await res.json()) as DamageReport | { error?: string };
              if (!res.ok) {
                throw new Error("error" in json && json.error ? json.error : "Damage API failed");
              }
              const next = json as DamageReport;
              setReport(next);

              await updateDoc(doc(db, "bookings", booking.bookingId), {
                damageReport: next,
                damageClaimStatus: "pending",
              });
              await createNotification(
                booking.ownerId,
                "damage_claim_submitted",
                `A driver raised a damage claim for booking #${booking.bookingId}.`,
                { bookingId: booking.bookingId, driverId: booking.driverId },
              );
              toast.success("Damage claim submitted");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed to submit claim");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Submitting..." : "Submit Claim"}
        </button>

        {report ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${severityCls(report.severity)}`}>
                {report.severity}
              </span>
              <span className="text-xs text-zinc-600">{report.confidenceScore}% confidence</span>
            </div>
            <div className="mt-2">Detected: {report.damageDetected ? "Yes" : "No"}</div>
            <div className="mt-1">Areas: {report.suspectedDamageAreas.join(", ") || "—"}</div>
            <div className="mt-1">Estimated cost: ₹{report.estimatedRepairCost}</div>
            <div className="mt-1">Recommendation: {report.recommendation}</div>
            <div className="mt-2 italic text-zinc-700">{report.aiRemarks}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

