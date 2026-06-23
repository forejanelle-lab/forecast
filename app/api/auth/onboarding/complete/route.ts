import {
  apiError,
  apiSuccess,
  requireSession,
} from "@/lib/auth-helpers";
import { markOnboardingComplete } from "@/lib/onboarding";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const sessionOrError = await requireSession();
    if (sessionOrError instanceof NextResponse) return sessionOrError;

    const session = sessionOrError;

    await markOnboardingComplete(session.user.id, session.user.role);

    return apiSuccess({ message: "Onboarding completed." });
  } catch (error) {
    console.error("Complete onboarding error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
