import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">🧭</div>
      <h1 className="text-2xl font-semibold text-zinc-900">Page not found</h1>
      <p className="max-w-md text-sm text-zinc-600">
        The page you are looking for does not exist or was moved.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      >
        Go to Home
      </Link>
    </div>
  );
}

