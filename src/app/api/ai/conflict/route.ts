import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Urgency = "low" | "medium" | "high";

function extractJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("No JSON object found");
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      currentBookingId: string;
      nextBookingId: string;
      spotId: string;
      extensionHours: number;
      nearbySpots: unknown[];
    };

    const prompt =
      `You are ParkShare's conflict resolution AI. ` +
      `A driver wants to extend their parking booking by ${body.extensionHours} hour(s), ` +
      `but another driver has already booked the same spot starting soon. Analyze the situation ` +
      `and return ONLY a valid JSON object with: compensationAmount (number, in INR, fair compensation for the displaced driver), ` +
      `compensationReason (string, one sentence), alternateSpotRecommendation (string, which nearby spot is best and why, one sentence), ` +
      `urgencyLevel ('low'|'medium'|'high'), resolutionStrategy (string, brief explanation of the recommended resolution). ` +
      `Context: currentBookingId=${body.currentBookingId}, nextBookingId=${body.nextBookingId}, spotId=${body.spotId}, nearbySpots=${JSON.stringify(
        body.nearbySpots ?? [],
      )}`;

    const raw = await callGemini(prompt);
    const parsed = extractJsonObject(raw) as {
      compensationAmount?: unknown;
      compensationReason?: unknown;
      alternateSpotRecommendation?: unknown;
      urgencyLevel?: unknown;
      resolutionStrategy?: unknown;
    };

    const compensationAmount = Number(parsed.compensationAmount);
    const compensationReason = String(parsed.compensationReason ?? "");
    const alternateSpotRecommendation = String(parsed.alternateSpotRecommendation ?? "");
    const urgencyLevel = String(parsed.urgencyLevel ?? "") as Urgency;
    const resolutionStrategy = String(parsed.resolutionStrategy ?? "");

    if (!Number.isFinite(compensationAmount) || compensationAmount < 0) {
      throw new Error("Invalid compensationAmount");
    }
    if (!compensationReason || !alternateSpotRecommendation || !resolutionStrategy) {
      throw new Error("Invalid AI conflict response");
    }
    if (!["low", "medium", "high"].includes(urgencyLevel)) {
      throw new Error("Invalid urgencyLevel");
    }

    return NextResponse.json({
      compensationAmount: Math.round(compensationAmount),
      compensationReason,
      alternateSpotRecommendation,
      urgencyLevel,
      resolutionStrategy,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

