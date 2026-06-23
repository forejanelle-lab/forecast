import { z } from "zod";
import { createAuthToken } from "@/lib/auth-tokens";
import { apiError, apiSuccess, normalizeEmail } from "@/lib/auth-helpers";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const email = normalizeEmail(parsed.data.email);
    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.passwordHash) {
      const token = await createAuthToken("password-reset", email);
      await sendPasswordResetEmail(email, token);
    }

    return apiSuccess({
      message:
        "If an account exists for that email, we've sent password reset instructions.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
