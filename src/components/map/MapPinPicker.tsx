"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker, type ViewStateChangeEvent } from "react-map-gl/mapbox";
import { MAPBOX_TOKEN } from "@/lib/mapbox";

export function MapPinPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}) {
  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
        Mapbox token not set. Add `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local` to
        use the pin picker.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ latitude, longitude, zoom: 14 }}
        onMove={(e: ViewStateChangeEvent) => {
          onChange(e.viewState.latitude, e.viewState.longitude);
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: 280 }}
      >
        <Marker latitude={latitude} longitude={longitude} anchor="bottom">
          <div className="h-5 w-5 rounded-full bg-red-600 ring-4 ring-red-200" />
        </Marker>
      </Map>
    </div>
  );
}

