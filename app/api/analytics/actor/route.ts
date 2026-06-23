import { apiSuccess } from "@/lib/auth-helpers";
import { requireActorSession } from "@/lib/api/guards";
import {
  getActorDashboardStats,
  getActorMembership,
} from "@/lib/data/projects";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const month = new URL(request.url).searchParams.get("month");

  const stats = await getActorDashboardStats(sessionOrError.user.id, month);
  const membership = await getActorMembership(sessionOrError.user.id);

  return apiSuccess({ stats, membership });
}
