import { apiSuccess } from "@/lib/auth-helpers";
import { requireActorSession } from "@/lib/api/guards";
import {
  clearActorAuditionCelebration,
  getActorAuditionCelebration,
} from "@/lib/actor-celebration";
import { NextResponse } from "next/server";

export async function GET() {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const celebration = await getActorAuditionCelebration(sessionOrError.user.id);
  return apiSuccess(celebration);
}

export async function POST() {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  await clearActorAuditionCelebration(sessionOrError.user.id);
  return apiSuccess({ ok: true });
}
