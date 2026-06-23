import { createAuthToken } from "@/lib/auth-tokens";
import {
  apiError,
  apiSuccess,
  isEmailVerified,
  requireSession,
} from "@/lib/auth-helpers";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const sessionOrError = await requireSession();
    if (sessionOrError instanceof NextResponse) return sessionOrError;

    const session = sessionOrError;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    });

    if (!user) {
      return apiError("User not found.", 404);
    }

    if (isEmailVerified(user.emailVerified)) {
      return apiSuccess({ message: "Your email is already verified." });
    }

    const token = await createAuthToken("email-verify", user.email);
    await sendVerificationEmail(user.email, token);

    return apiSuccess({
      message: "Verification email sent. Check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
