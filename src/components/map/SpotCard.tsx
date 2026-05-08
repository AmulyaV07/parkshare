"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { etaMinutes } from "@/lib/mapbox";
import type { ParkingSpot } from "@/types";

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

  const images = spot?.images ?? [];
  const hasImages = images.length > 0;

  const eta = useMemo(() => {
    if (!spot) return null;
    if (typeof spot.distanceKm !== "number") return null;
    return etaMinutes(spot.distanceKm);
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
                onClick={() => toast("Booking flow comes in Phase 7")}
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
    </div>
  );
}

