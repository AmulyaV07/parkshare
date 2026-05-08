import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Bookings API placeholder (Phase 7).",
  });
}

