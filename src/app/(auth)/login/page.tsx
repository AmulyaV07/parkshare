"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { userRole, loading, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!userRole) return;
    router.replace(userRole === "driver" ? "/driver" : "/owner");
  }, [loading, router, userRole]);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <div className="text-sm font-semibold tracking-wide text-zinc-500">
            ParkShare
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Sign in
          </h1>
          <p className="text-sm text-zinc-600">
            Continue with Google to access ParkShare.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={busy || loading}
            className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={async () => {
              try {
                setBusy(true);
                await signInWithGoogle();
                router.replace("/role-select");
              } catch (e) {
                toast.error("Sign-in failed. Please try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Signing in..." : "Continue with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}

