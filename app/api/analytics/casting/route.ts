import { apiSuccess } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import {
  getCastingDashboardStats,
  getCastingProjectPerformance,
} from "@/lib/data/projects";
import { NextResponse } from "next/server";

export async function GET() {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const stats = await getCastingDashboardStats(sessionOrError.user.id);
  const projectPerformance = await getCastingProjectPerformance(
    sessionOrError.user.id,
  );

  return apiSuccess({ stats, projectPerformance });
}
