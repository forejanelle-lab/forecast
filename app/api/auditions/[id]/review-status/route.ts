import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import { persistAuditionReviewForCasting } from "@/lib/data/booking";
import { NextResponse } from "next/server";

const patchSchema = z.object({
  status: z.enum([
    "submitted",
    "audition_viewed",
    "reviewing",
    "audition_requested",
    "callback",
    "rejected",
    "accepted",
  ]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    await persistAuditionReviewForCasting({
      castingUserId: sessionOrError.user.id,
      auditionId: id,
      status: parsed.data.status,
    });
    return apiSuccess({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update status";
    if (message === "Audition not found") {
      return apiError(message, 404);
    }
    return apiError(message);
  }
}
