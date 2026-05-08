"use client";

import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { useAppStore, type UserRole } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";

function RoleCard({
  title,
  description,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="text-lg font-semibold tracking-tight text-zinc-950">
        {title}
      </div>
      <div className="mt-1 text-sm text-zinc-600">{description}</div>
    </button>
  );
}

export default function RoleSelectPage() {
  const router = useRouter();
  const setUserRole = useAppStore((s) => s.setUserRole);
  const { user, loading, userRole } = useAuth();
  const [busyRole, setBusyRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [loading, router, user]);

  useEffect(() => {
    if (!userRole) return;
    router.replace(userRole === "driver" ? "/driver" : "/owner");
  }, [router, userRole]);

  async function chooseRole(role: UserRole) {
    if (!user) return;
    try {
      setBusyRole(role);
      await setDoc(
        doc(db, "users", user.uid),
        { role },
        {
          merge: true,
        },
      );
      setUserRole(role);
      router.replace(role === "driver" ? "/driver" : "/owner");
    } catch (e) {
      toast.error("Could not save role. Please try again.");
    } finally {
      setBusyRole(null);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <div className="text-sm font-semibold tracking-wide text-zinc-500">
            ParkShare
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
            Choose your role
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            You can change this later (we’ll add settings in a later phase).
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <RoleCard
            title="I’m a Driver"
            description="Find, book, extend, and manage parking spots."
            disabled={!!busyRole}
            onClick={() => chooseRole("driver")}
          />
          <RoleCard
            title="I’m a Parking Owner"
            description="List your spot, manage bookings, and review claims."
            disabled={!!busyRole}
            onClick={() => chooseRole("owner")}
          />
        </div>

        {busyRole ? (
          <div className="mt-6 text-center text-sm text-zinc-600">
            Saving your role...
          </div>
        ) : null}
      </div>
    </div>
  );
}

