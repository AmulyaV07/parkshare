import { Navbar } from "@/components/shared/Navbar";

export default function OwnerDashboardPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <Navbar />
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Owner dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            You’re signed in. Spot listing + bookings comes in Phase 4+.
          </p>
        </div>
      </div>
    </div>
  );
}

