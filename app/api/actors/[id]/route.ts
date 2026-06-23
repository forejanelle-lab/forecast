import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireAuthSession } from "@/lib/api/guards";
import {
  getActorProfileByUserId,
  recordProfileView,
} from "@/lib/data/actors";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const profile = await getActorProfileByUserId(id);
  if (!profile) return apiError("Actor not found", 404);

  if (sessionOrError.user.id !== id) {
    await recordProfileView(id, sessionOrError.user.id);
  }

  return apiSuccess({ profile });
}
