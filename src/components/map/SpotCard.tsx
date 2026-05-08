"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { etaMinutes } from "@/lib/mapbox";
import type { ParkingSpot } from "@/types";
import { BookingConfirmation } from "@/components/driver/BookingConfirmation";

type AiPrice = {
  surgeMultiplier: number;
  finalPrice: number;
  reasoning: string;
  demandLevel: "low" | "medium" | "high" | "very_high";
};

function demandBadgeClasses(level: AiPrice["demandLevel"]) {
  if (level === "very_high") return "bg-fuchsia-600 text-white";
  if (level === "high") return "bg-red-600 text-white";
  if (level === "medium") return "bg-amber-500 text-white";
  return "bg-emerald-600 text-white";
}

export function SpotCard({
  spot,
  userLat,
  userLng,
  onClose,
}: {
  spot: (ParkingSpot & { spotId: string; distanceKm?: number }) | null;
  userLat: number | null;
  userLng: number | null;
  onClose: () => void;
}) {
  const [duration, setDuration] = useState<number>(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [ai, setAi] = useState<AiPrice | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const images = spot?.images ?? [];
  const hasImages = images.length > 0;

  const eta = useMemo(() => {
    if (!spot) return null;
    if (typeof spot.distanceKm !== "number") return null;
    return etaMinutes(spot.distanceKm);
  }, [spot]);

  useEffect(() => {
    if (!spot) return;

    const ctrl = new AbortController();
    const load = async () => {
      try {
        setAiLoading(true);
        setAiError(null);
        setAi(null);

        const now = new Date();
        const timeOfDay = now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const dayOfWeek = now.toLocaleDateString("en-IN", { weekday: "long" });

        // Lightweight defaults for Phase 6; can be replaced with real occupancy later.
        const occupancyNearby = 0.6;
        const hasUpcomingBooking = false;

        const res = await fetch("/api/ai/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spotId: spot.spotId,
            baseRate: spot.baseHourlyRate,
            lat: spot.latitude,
            lng: spot.longitude,
            timeOfDay,
            dayOfWeek,
            occupancyNearby,
            hasUpcomingBooking,
          }),
          signal: ctrl.signal,
        });

        const json = (await res.json()) as AiPrice | { error?: string };
        if (!res.ok) {
          throw new Error("error" in json && json.error ? json.error : "Pricing failed");
        }
        setAi(json as AiPrice);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setAiError(e instanceof Error ? e.message : "Failed to load AI price");
      } finally {
        if (!ctrl.signal.aborted) setAiLoading(false);
      }
    };

    load();
    return () => ctrl.abort();
  }, [spot]);

  if (!spot) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-3">
      <div className="pointer-events-auto mx-auto w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-zinc-950">
              {spot.title}
            </div>
            <div className="mt-1 truncate text-xs text-zinc-500">
              {spot.address}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Close
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
              {hasImages ? (
                <div className="relative h-44 w-full">
                  <Image
                    src={images[Math.min(imgIdx, images.length - 1)]}
                    alt={spot.title}
                    fill
                    className="object-cover"
                  />
                  {images.length > 1 ? (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <button
                        type="button"
                        className="rounded-lg bg-white/90 px-2 py-1 text-xs"
                        onClick={() =>
                          setImgIdx((p) => (p - 1 + images.length) % images.length)
                        }
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-white/90 px-2 py-1 text-xs"
                        onClick={() => setImgIdx((p) => (p + 1) % images.length)}
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center text-sm text-zinc-500">
                  No photos
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800">
                  ₹{spot.baseHourlyRate}/hr
                </span>
                {aiLoading ? (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                    AI Price: loading…
                  </span>
                ) : ai ? (
                  <span className="flex items-center gap-2 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800">
                    AI Price: ₹{ai.finalPrice}/hr
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        demandBadgeClasses(ai.demandLevel),
                      ].join(" ")}
                    >
                      {ai.demandLevel.replace("_", " ")}
                    </span>
                  </span>
                ) : aiError ? (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                    AI Price unavailable
                  </span>
                ) : null}
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  ₹{spot.baseDailyRate}/day
                </span>
                {typeof spot.distanceKm === "number" ? (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                    {spot.distanceKm.toFixed(1)} km
                    {eta ? ` • ~${eta} min` : ""}
                  </span>
                ) : null}
              </div>

              {ai && !aiLoading ? (
                <div className="text-xs italic text-zinc-600">{ai.reasoning}</div>
              ) : null}

              <div className="flex flex-wrap gap-2 text-xs text-zinc-700">
                {spot.isCovered ? (
                  <span className="rounded-full border border-zinc-200 px-2.5 py-1">
                    Covered
                  </span>
                ) : null}
                {spot.hasEVCharging ? (
                  <span className="rounded-full border border-zinc-200 px-2.5 py-1">
                    EV
                  </span>
                ) : null}
                {spot.hasCCTV ? (
                  <span className="rounded-full border border-zinc-200 px-2.5 py-1">
                    CCTV
                  </span>
                ) : null}
              </div>

              <div>
                <div className="text-xs font-semibold text-zinc-900">Duration</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 2, 3].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDuration(h)}
                      className={[
                        "rounded-xl px-3 py-2 text-sm font-medium",
                        duration === h
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                      ].join(" ")}
                    >
                      {h}h
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                    className="w-24 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <button
                type="button"
                className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white"
                onClick={() => {
                  if (!ai && !aiLoading) {
                    toast("AI price not ready yet — booking will use base price.");
                  }
                  setConfirmOpen(true);
                }}
              >
                Book now
              </button>

              {userLat && userLng ? null : (
                <div className="text-xs text-zinc-500">
                  Location permission improves distance & ETA.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BookingConfirmation
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        spot={spot}
        durationHours={duration}
        aiFinalPricePerHour={ai?.finalPrice ?? null}
        aiSurgeMultiplier={ai?.surgeMultiplier ?? 1}
      />
    </div>
  );
}

