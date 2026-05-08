import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      bookingId: string;
      entryVideoURL: string | null;
      exitVideoURL: string | null;
      driverNote: string;
    };

    if (!body.bookingId || !body.driverNote?.trim()) {
      throw new Error("Missing bookingId or driverNote");
    }

    const prompt =
      `You are ParkShare's AI damage verification system. ` +
      `A driver has raised a damage complaint after parking. ` +
      `The driver's note says: '${body.driverNote}'. ` +
      `Based on this complaint description, generate a realistic damage assessment report as a JSON object ` +
      `with: damageDetected (boolean), confidenceScore (number 0-100), suspectedDamageAreas (array of strings), ` +
      `severity ('none'|'minor'|'moderate'|'severe'), estimatedRepairCost (number in INR), ` +
      `recommendation ('dismiss'|'investigate'|'compensate'), aiRemarks (string, 2-3 sentence analysis). ` +
      `Note: This is a demo system. Generate a plausible report based on the driver's note. ` +
      `Context: bookingId=${body.bookingId}, entryVideoURL=${body.entryVideoURL ?? "none"}, exitVideoURL=${body.exitVideoURL ?? "none"}`;

    const raw = await callGemini(prompt);
    const parsed = extractJsonObject(raw) as {
      damageDetected?: unknown;
      confidenceScore?: unknown;
      suspectedDamageAreas?: unknown;
      severity?: unknown;
      estimatedRepairCost?: unknown;
      recommendation?: unknown;
      aiRemarks?: unknown;
    };

    const report = {
      damageDetected: Boolean(parsed.damageDetected),
      confidenceScore: Math.max(0, Math.min(100, Number(parsed.confidenceScore ?? 0))),
      suspectedDamageAreas: Array.isArray(parsed.suspectedDamageAreas)
        ? parsed.suspectedDamageAreas.map((x) => String(x))
        : [],
      severity: String(parsed.severity ?? "none"),
      estimatedRepairCost: Math.max(0, Math.round(Number(parsed.estimatedRepairCost ?? 0))),
      recommendation: String(parsed.recommendation ?? "investigate"),
      aiRemarks: String(parsed.aiRemarks ?? ""),
    };

    if (!["none", "minor", "moderate", "severe"].includes(report.severity)) {
      throw new Error("Invalid severity");
    }
    if (!["dismiss", "investigate", "compensate"].includes(report.recommendation)) {
      throw new Error("Invalid recommendation");
    }
    if (!report.aiRemarks) throw new Error("Missing aiRemarks");

    return NextResponse.json(report);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

