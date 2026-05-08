"use client";

import Link from "next/link";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Booking } from "@/types";
import { BookingCard } from "@/components/owner/BookingCard";

type TabKey = "active" | "upcoming" | "history";

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-zinc-900 text-white"
          : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function OwnerDashboardClient() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("active");
  const [bookings, setBookings] = useState<(Booking & { bookingId: string })[]>(
    [],
  );

  useEffect(() => {
    if (!user) return;

    const statuses =
      tab === "active"
        ? (["active", "overstaying"] as const)
        : tab === "upcoming"
          ? (["upcoming"] as const)
          : (["completed", "cancelled"] as const);

    const q = query(
      collection(db, "bookings"),
      where("ownerId", "==", user.uid),
      where("status", "in", [...statuses]),
    );

    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => ({
        ...(d.data() as Booking),
        bookingId: d.id,
      }));
      next.sort((a, b) => {
        const aStart = a.startTime?.toMillis?.() ?? 0;
        const bStart = b.startTime?.toMillis?.() ?? 0;
        return bStart - aStart;
      });
      setBookings(next);
    });

    return () => unsub();
  }, [tab, user]);

  const title = useMemo(() => {
    if (tab === "active") return "Active";
    if (tab === "upcoming") return "Pre-Booked";
    return "History";
  }, [tab]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <Navbar />

      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Owner dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Manage bookings and your listed parking spots.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/owner/list-spot"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              + List a spot
            </Link>
            <Link
              href="/owner/spots"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              My spots
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <TabButton
            active={tab === "active"}
            onClick={() => setTab("active")}
            label="Active"
          />
          <TabButton
            active={tab === "upcoming"}
            onClick={() => setTab("upcoming")}
            label="Pre-Booked"
          />
          <TabButton
            active={tab === "history"}
            onClick={() => setTab("history")}
            label="History"
          />
        </div>

        <div className="mt-6">
          <div className="mb-3 text-sm font-semibold text-zinc-950">
            {title} bookings
          </div>

          {user ? (
            bookings.length > 0 ? (
              <div className="grid gap-3">
                {bookings.map((b) => (
                  <BookingCard key={b.bookingId} booking={b} ownerId={user.uid} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
                No {title.toLowerCase()} bookings yet.
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

