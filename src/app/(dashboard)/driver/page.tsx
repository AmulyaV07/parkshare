import Link from "next/link";

export default function DriverDashboardPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <div className="text-sm font-semibold tracking-wide text-zinc-500">
            ParkShare
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Driver dashboard (Phase 2+)
          </h1>
          <p className="text-sm text-zinc-600">
            This is a placeholder page so builds succeed during Phase 1.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            className="rounded-xl border border-zinc-200 px-4 py-2 hover:bg-zinc-50"
            href="/login"
          >
            Go to Login
          </Link>
          <Link
            className="rounded-xl border border-zinc-200 px-4 py-2 hover:bg-zinc-50"
            href="/"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

