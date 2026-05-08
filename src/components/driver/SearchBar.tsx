"use client";

import { useEffect, useMemo, useState } from "react";
import { MAPBOX_TOKEN } from "@/lib/mapbox";

type Feature = {
  id: string;
  place_name: string;
  center: [number, number];
};

export type SpotFilters = {
  minPrice?: number;
  maxPrice?: number;
  covered?: boolean;
  ev?: boolean;
  cctv?: boolean;
};

export function SearchBar({
  onPick,
  filters,
  onFiltersChange,
}: {
  onPick: (lat: number, lng: number) => void;
  filters: SpotFilters;
  onFiltersChange: (next: SpotFilters) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Feature[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const canSearch = useMemo(() => q.trim().length >= 3 && !!MAPBOX_TOKEN, [q]);

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      return;
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
          `${encodeURIComponent(q.trim())}.json?access_token=${encodeURIComponent(
            MAPBOX_TOKEN,
          )}&autocomplete=true&limit=5`;
        const res = await fetch(url, { signal: ctrl.signal });
        const json = (await res.json()) as { features?: Feature[] };
        setResults(json.features ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [canSearch, q]);

  return (
    <div className="relative">
      <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
        <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={
            MAPBOX_TOKEN ? "Search location…" : "Mapbox token missing…"
          }
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 disabled:opacity-60"
          disabled={!MAPBOX_TOKEN}
        />
          <button
            type="button"
            onClick={() => setFiltersOpen((p) => !p)}
            className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Filters
          </button>
        </div>
        {loading ? (
          <div className="mt-2 px-3 text-xs text-zinc-500">Searching…</div>
        ) : null}
      </div>

      {open && results.length ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="block w-full px-4 py-3 text-left text-sm text-zinc-800 hover:bg-zinc-50"
              onClick={() => {
                const [lng, lat] = r.center;
                onPick(lat, lng);
                setQ(r.place_name);
                setOpen(false);
              }}
            >
              {r.place_name}
            </button>
          ))}
        </div>
      ) : null}

      {filtersOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-zinc-900">Filters</div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                onClick={() => setFiltersOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <div className="text-xs font-medium text-zinc-700">Min ₹/hr</div>
                <input
                  type="number"
                  min={0}
                  value={filters.minPrice ?? ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      minPrice:
                        e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </label>
              <label className="space-y-1">
                <div className="text-xs font-medium text-zinc-700">Max ₹/hr</div>
                <input
                  type="number"
                  min={0}
                  value={filters.maxPrice ?? ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      maxPrice:
                        e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, covered: !filters.covered })}
                className={[
                  "rounded-xl border px-3 py-2 text-xs font-semibold",
                  filters.covered
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                ].join(" ")}
              >
                Covered
              </button>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, ev: !filters.ev })}
                className={[
                  "rounded-xl border px-3 py-2 text-xs font-semibold",
                  filters.ev
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                ].join(" ")}
              >
                EV
              </button>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, cctv: !filters.cctv })}
                className={[
                  "rounded-xl border px-3 py-2 text-xs font-semibold",
                  filters.cctv
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                ].join(" ")}
              >
                CCTV
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onFiltersChange({})}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

