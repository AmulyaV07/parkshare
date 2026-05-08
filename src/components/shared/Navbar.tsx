"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const router = useRouter();
  const { user, userRole, signOut } = useAuth();

  return (
    <div className="w-full border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          className="text-left"
          onClick={() => router.push("/")}
        >
          <div className="text-sm font-semibold tracking-wide text-zinc-950">
            ParkShare
          </div>
          <div className="text-xs text-zinc-500">MVP</div>
        </button>

        <div className="flex items-center gap-3">
          {userRole ? (
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700">
              {userRole === "driver" ? "Driver" : "Owner"}
            </span>
          ) : null}

          {user ? (
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName ?? "Profile"}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-zinc-200" />
              )}
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-zinc-900">
                  {user.displayName ?? "User"}
                </div>
                <div className="text-xs text-zinc-500">{user.email ?? ""}</div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
                onClick={() => router.push("/role-select")}
              >
                Change role
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
                onClick={async () => {
                  await signOut();
                  router.push("/login");
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

