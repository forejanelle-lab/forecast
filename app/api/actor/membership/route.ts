import { apiSuccess } from "@/lib/auth-helpers";
import { requireActorSession } from "@/lib/api/guards";
import { getActorMembership } from "@/lib/data/projects";
import { NextResponse } from "next/server";

export async function GET() {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const membership = await getActorMembership(sessionOrError.user.id);
  return apiSuccess(membership);
}
