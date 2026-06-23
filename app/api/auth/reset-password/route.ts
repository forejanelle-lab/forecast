import bcrypt from "bcryptjs";
import { z } from "zod";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const email = await consumeAuthToken("password-reset", parsed.data.token);
    if (!email) {
      return apiError("This reset link is invalid or has expired.", 400);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    return apiSuccess({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
