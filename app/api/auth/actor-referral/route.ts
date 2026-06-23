import { z } from "zod";
import {
  ReferralValidationError,
  submitActorReferral,
} from "@/lib/actor-referral";
import { apiError, apiSuccess, requireSession } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";

const schema = z.object({
  referredName: z.string().min(1, "Please enter your fellow actor's name."),
  referredEmail: z.string().email("Please enter a valid email address."),
});

export async function POST(request: Request) {
  try {
    const sessionOrError = await requireSession();
    if (sessionOrError instanceof NextResponse) return sessionOrError;

    const session = sessionOrError;

    if (session.user.role !== "ACTOR") {
      return apiError("Only actors can submit referrals.", 403);
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const result = await submitActorReferral(
      session.user.id,
      session.user.email,
      parsed.data.referredName,
      parsed.data.referredEmail,
    );

    return apiSuccess({
      message: "30-day Premium trial activated.",
      ...result,
    });
  } catch (error) {
    if (error instanceof ReferralValidationError) {
      return apiError(error.message);
    }

    console.error("Actor referral error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
