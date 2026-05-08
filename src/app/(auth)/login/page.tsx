import Link from "next/link";

export default function LoginPage() {
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
            Authentication will be wired up in Phase 2.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            Continue with Google (coming next)
          </button>

          <div className="text-center text-xs text-zinc-500">
            For now, visit{" "}
            <Link className="underline" href="/driver">
              /driver
            </Link>{" "}
            or{" "}
            <Link className="underline" href="/owner">
              /owner
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

