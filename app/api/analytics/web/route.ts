import { requireCastingSession } from "@/lib/api/guards";
import { getWebAnalyticsSummary } from "@/lib/site-analytics";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? "7");

  const summary = await getWebAnalyticsSummary(days);
  return NextResponse.json(summary);
}
