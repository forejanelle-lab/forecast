import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import { bookActor } from "@/lib/data/booking";
import { BOOKING_ALREADY_SENT_ERROR } from "@/lib/casting-submission-actions";
import { ROLE_ALREADY_BOOKED_ERROR } from "@/lib/role-booking";
import { NextResponse } from "next/server";

const bodySchema = z
  .object({
    applicationId: z.string().optional(),
    auditionId: z.string().optional(),
    message: z.string().min(1, "Message is required"),
  })
  .refine((data) => data.applicationId || data.auditionId, {
    message: "applicationId or auditionId is required",
  });

export async function POST(request: Request) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    await bookActor({
      castingUserId: sessionOrError.user.id,
      applicationId: parsed.data.applicationId,
      auditionId: parsed.data.auditionId,
      message: parsed.data.message,
    });
    return apiSuccess({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to book actor";
    if (message === "Submission not found") {
      return apiError(message, 404);
    }
    if (message === ROLE_ALREADY_BOOKED_ERROR) {
      return apiError(message, 400);
    }
    if (message === BOOKING_ALREADY_SENT_ERROR) {
      return apiError(message, 400);
    }
    return apiError(message);
  }
}
