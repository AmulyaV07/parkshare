"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!userRole) {
      router.replace("/role-select");
      return;
    }
    router.replace(userRole === "driver" ? "/driver" : "/owner");
  }, [loading, router, user, userRole]);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold tracking-wide text-zinc-500">
          ParkShare
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
          Redirecting…
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          If you’re not redirected automatically, use these links:
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link
            className="rounded-xl border border-zinc-200 px-3 py-2 hover:bg-zinc-50"
            href="/login"
          >
            Login
          </Link>
          <Link
            className="rounded-xl border border-zinc-200 px-3 py-2 hover:bg-zinc-50"
            href="/role-select"
          >
            Role select
          </Link>
          <Link
            className="rounded-xl border border-zinc-200 px-3 py-2 hover:bg-zinc-50"
            href="/driver"
          >
            Driver
          </Link>
          <Link
            className="rounded-xl border border-zinc-200 px-3 py-2 hover:bg-zinc-50"
            href="/owner"
          >
            Owner
          </Link>
        </div>
      </div>
    </div>
  );
}
