import { getAdminAnalyticsDashboard } from "@/lib/analytics/metrics";
import { requireAdminSession } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const sessionOrError = await requireAdminSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const dashboard = await getAdminAnalyticsDashboard();
  return NextResponse.json(dashboard);
}
