import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  apiError,
  apiSuccess,
  requireSession,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const sessionOrError = await requireSession();
    if (sessionOrError instanceof NextResponse) return sessionOrError;

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.user.update({
      where: { id: sessionOrError.user.id },
      data: { passwordHash },
    });

    return apiSuccess({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
