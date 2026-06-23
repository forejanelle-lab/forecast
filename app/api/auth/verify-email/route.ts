import { z } from "zod";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  token: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({ token: searchParams.get("token") });

    if (!parsed.success) {
      return apiError("Verification token is required.");
    }

    const email = await consumeAuthToken("email-verify", parsed.data.token);
    if (!email) {
      return apiError("This verification link is invalid or has expired.", 400);
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    return apiSuccess({ message: "Email verified successfully.", email });
  } catch (error) {
    console.error("Verify email error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
