import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

type DemandLevel = "low" | "medium" | "high" | "very_high";

function extractJsonObject(text: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // ignore
  }

  // Then try to extract the first {...} block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const candidate = text.slice(start, end + 1);
    return JSON.parse(candidate);
  }
  throw new Error("No JSON object found in Gemini response");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      spotId: string;
      baseRate: number;
      lat: number;
      lng: number;
      timeOfDay: string;
      dayOfWeek: string;
      occupancyNearby: number;
      hasUpcomingBooking: boolean;
    };

    const prompt =
      `You are a smart parking pricing AI for ParkShare, an urban parking marketplace in India. ` +
      `Given the following context, calculate a dynamic price multiplier (between 1.0 and 3.0) ` +
      `and return ONLY a valid JSON object with these fields: surgeMultiplier (number), finalPrice (number, ` +
      `baseRate × surgeMultiplier, rounded to nearest 10), reasoning (string, one sentence explaining why), ` +
      `demandLevel ('low'|'medium'|'high'|'very_high'). ` +
      `Context: Base rate ₹${body.baseRate}/hr. Time: ${body.timeOfDay} on ${body.dayOfWeek}. ` +
      `Nearby occupancy: ${Math.round(body.occupancyNearby * 100)}%. ` +
      `Upcoming booking conflict: ${body.hasUpcomingBooking}. ` +
      `Location lat/lng: ${body.lat},${body.lng}.`;

    const raw = await callGemini(prompt);
    const parsed = extractJsonObject(raw) as {
      surgeMultiplier?: unknown;
      finalPrice?: unknown;
      reasoning?: unknown;
      demandLevel?: unknown;
    };

    const surgeMultiplier = Number(parsed.surgeMultiplier);
    const finalPrice = Number(parsed.finalPrice);
    const reasoning = String(parsed.reasoning ?? "");
    const demandLevel = String(parsed.demandLevel ?? "") as DemandLevel;

    if (!Number.isFinite(surgeMultiplier) || surgeMultiplier < 1 || surgeMultiplier > 3) {
      throw new Error("Invalid surgeMultiplier from Gemini");
    }
    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      throw new Error("Invalid finalPrice from Gemini");
    }
    if (!reasoning) throw new Error("Missing reasoning from Gemini");
    if (!["low", "medium", "high", "very_high"].includes(demandLevel)) {
      throw new Error("Invalid demandLevel from Gemini");
    }

    return NextResponse.json({
      spotId: body.spotId,
      surgeMultiplier,
      finalPrice,
      reasoning,
      demandLevel,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

