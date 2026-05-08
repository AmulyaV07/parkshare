"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import toast from "react-hot-toast";
import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import type { ParkingSpot } from "@/types";

export default function OwnerSpotsPage() {
  const { user } = useAuth();
  const [spots, setSpots] = useState<(ParkingSpot & { spotId: string })[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "parkingSpots"),
      where("ownerId", "==", user.uid),
    );
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => ({
        ...(d.data() as ParkingSpot),
        spotId: d.id,
      }));
      next.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
      setSpots(next);
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              My spots
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Toggle active/inactive and manage your listings.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/owner/list-spot"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              + List a spot
            </Link>
            <Link
              href="/owner"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="mt-6">
          {!user ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
              Loading...
            </div>
          ) : spots.length ? (
            <div className="grid gap-3">
              {spots.map((s) => (
                <div
                  key={s.spotId}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-950">
                        {s.title}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">{s.address}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                          ₹{s.baseHourlyRate}/hr • ₹{s.baseDailyRate}/day
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, "parkingSpots", s.spotId), {
                              isActive: !s.isActive,
                            });
                            toast.success(
                              !s.isActive ? "Spot activated." : "Spot deactivated.",
                            );
                          } catch {
                            toast.error("Could not update spot.");
                          }
                        }}
                      >
                        {s.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
                        onClick={() => toast("Edit comes next (Phase 4+)")}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                        onClick={async () => {
                          if (!confirm("Delete this spot? This cannot be undone.")) {
                            return;
                          }
                          try {
                            await deleteDoc(doc(db, "parkingSpots", s.spotId));
                            toast.success("Spot deleted.");
                          } catch {
                            toast.error("Could not delete spot.");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
              No spots yet. Click “List a spot” to add one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

