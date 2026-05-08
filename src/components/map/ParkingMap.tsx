"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { MAPBOX_TOKEN, distanceKm } from "@/lib/mapbox";
import { db } from "@/lib/firebase";
import type { Booking, ParkingSpot } from "@/types";
import { SpotCard } from "@/components/map/SpotCard";
import { SearchBar, type SpotFilters } from "@/components/driver/SearchBar";

type SpotWithMeta = ParkingSpot & {
  spotId: string;
  distanceKm?: number;
  markerColor: "blue" | "red" | "yellow";
};

function markerClasses(color: SpotWithMeta["markerColor"]) {
  if (color === "red") return "bg-red-600 ring-red-200";
  if (color === "yellow") return "bg-amber-500 ring-amber-200";
  return "bg-blue-600 ring-blue-200";
}

export function ParkingMap() {
  const mapRef = useRef<MapRef | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [spots, setSpots] = useState<(ParkingSpot & { spotId: string })[]>([]);
  const [activeBookingsBySpot, setActiveBookingsBySpot] = useState<
    Record<string, Booking & { bookingId: string }>
  >({});
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 12.9716,
    lng: 77.5946, // Bengaluru default
  });
  const [filters, setFilters] = useState<SpotFilters>({});
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(next);
        setCenter(next);
      },
      () => {
        // ignore; we keep default center
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    const q = query(collection(db, "parkingSpots"), where("isActive", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setSpots(
        snap.docs.map((d) => ({ ...(d.data() as ParkingSpot), spotId: d.id })),
      );
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Minimal "availability" logic for Phase 5:
    // - red: has active/overstaying booking
    // - yellow: active booking ends within 30 mins
    const q = query(
      collection(db, "bookings"),
      where("status", "in", ["active", "overstaying"]),
    );
    const unsub = onSnapshot(q, (snap) => {
      const next: Record<string, Booking & { bookingId: string }> = {};
      snap.docs.forEach((d) => {
        const b = d.data() as Booking;
        if (!b.spotId) return;
        next[b.spotId] = { ...b, bookingId: d.id };
      });
      setActiveBookingsBySpot(next);
    });
    return () => unsub();
  }, []);

  const spotsWithMeta: SpotWithMeta[] = useMemo(() => {
    return spots.map((s) => {
      const active = activeBookingsBySpot[s.spotId];
      let markerColor: SpotWithMeta["markerColor"] = "blue";
      if (active) {
        markerColor = "red";
        const endMs = active.endTime?.toMillis?.() ?? 0;
        const minsLeft = endMs ? (endMs - nowMs) / (1000 * 60) : 999;
        if (minsLeft <= 30) markerColor = "yellow";
      }

      const dist =
        userLoc ? distanceKm(userLoc.lat, userLoc.lng, s.latitude, s.longitude) : undefined;
      return { ...s, distanceKm: dist, markerColor };
    });
  }, [activeBookingsBySpot, nowMs, spots, userLoc]);

  const filteredSpots: SpotWithMeta[] = useMemo(() => {
    return spotsWithMeta.filter((s) => {
      if (typeof filters.minPrice === "number" && s.baseHourlyRate < filters.minPrice)
        return false;
      if (typeof filters.maxPrice === "number" && s.baseHourlyRate > filters.maxPrice)
        return false;
      if (filters.covered && !s.isCovered) return false;
      if (filters.ev && !s.hasEVCharging) return false;
      if (filters.cctv && !s.hasCCTV) return false;
      return true;
    });
  }, [filters, spotsWithMeta]);

  const selectedSpot = useMemo(() => {
    if (!selectedSpotId) return null;
    return filteredSpots.find((s) => s.spotId === selectedSpotId) ?? null;
  }, [filteredSpots, selectedSpotId]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-700">
          Mapbox token missing. Add `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`,
          then restart `npm run dev`.
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ latitude: center.lat, longitude: center.lng, zoom: 13 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
      >
        {filteredSpots.map((s) => (
          <Marker
            key={s.spotId}
            latitude={s.latitude}
            longitude={s.longitude}
            anchor="bottom"
          >
            <button
              type="button"
              onClick={() => setSelectedSpotId(s.spotId)}
              className="group relative"
            >
              <div
                className={[
                  "h-4 w-4 rounded-full ring-4 transition group-hover:scale-110",
                  markerClasses(s.markerColor),
                ].join(" ")}
              />
              <div className="absolute left-1/2 top-[-38px] -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-900 shadow">
                ₹{s.baseHourlyRate}/hr
                {typeof s.distanceKm === "number" ? (
                  <span className="ml-2 font-medium text-zinc-500">
                    {s.distanceKm.toFixed(1)} km
                  </span>
                ) : null}
              </div>
            </button>
          </Marker>
        ))}
      </Map>

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 p-3">
        <div className="pointer-events-auto mx-auto w-full max-w-2xl">
          <SearchBar
            onPick={(lat, lng) => {
              setCenter({ lat, lng });
              mapRef.current?.flyTo({ center: [lng, lat], zoom: 13, duration: 900 });
            }}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>

      <SpotCard
        spot={selectedSpot}
        userLat={userLoc?.lat ?? null}
        userLng={userLoc?.lng ?? null}
        onClose={() => setSelectedSpotId(null)}
      />
    </div>
  );
}

