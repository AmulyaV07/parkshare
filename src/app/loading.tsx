export default function AppLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      <div className="text-sm font-medium text-zinc-700">ParkShare loading...</div>
    </div>
  );
}

