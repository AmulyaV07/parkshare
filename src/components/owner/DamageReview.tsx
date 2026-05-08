"use client";

import type { Booking } from "@/types";

export function DamageReview({ booking }: { booking: Booking }) {
  const report = booking.damageReport;

  if (!report) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        No damage report for this booking.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-zinc-950">Damage review</div>

      <div className="mt-2 grid gap-2 text-sm text-zinc-700">
        <div>
          <span className="font-medium">Detected:</span>{" "}
          {report.damageDetected ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-medium">Severity:</span> {report.severity}
        </div>
        <div>
          <span className="font-medium">Confidence:</span>{" "}
          {report.confidenceScore}%
        </div>
        <div>
          <span className="font-medium">Areas:</span>{" "}
          {report.suspectedDamageAreas.join(", ") || "—"}
        </div>
        <div>
          <span className="font-medium">Estimate:</span> ₹
          {report.estimatedRepairCost}
        </div>
        <div className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
          {report.aiRemarks}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {booking.entryVideoURL ? (
          <a
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            href={booking.entryVideoURL}
            target="_blank"
            rel="noreferrer"
          >
            View entry video
          </a>
        ) : null}
        {booking.exitVideoURL ? (
          <a
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            href={booking.exitVideoURL}
            target="_blank"
            rel="noreferrer"
          >
            View exit video
          </a>
        ) : null}
        <button
          type="button"
          className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
        >
          Accept (mock)
        </button>
        <button
          type="button"
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
        >
          Reject (mock)
        </button>
      </div>
    </div>
  );
}

