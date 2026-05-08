"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-200/80 ${className}`} />;
}

