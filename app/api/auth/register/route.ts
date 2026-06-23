import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthToken } from "@/lib/auth-tokens";
import { apiError } from "@/lib/auth-helpers";
import {
  sendNewAccountNotificationToSupport,
  sendVerificationEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { formatFullName } from "@/lib/user";

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ACTOR", "CASTING"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { firstName, lastName, email: rawEmail, password, role } = parsed.data;
    const email = rawEmail.trim().toLowerCase();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const fullName = formatFullName(normalizedFirstName, normalizedLastName);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("An account with this email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        name: fullName,
        email,
        passwordHash,
        role,
        actorProfile: role === "ACTOR" ? { create: {} } : undefined,
        castingProfile: role === "CASTING" ? { create: {} } : undefined,
      },
    });

    try {
      const token = await createAuthToken("email-verify", email);
      await sendVerificationEmail(email, token);
    } catch (emailError) {
      console.error("Verification email failed:", emailError);
    }

    try {
      await sendNewAccountNotificationToSupport({
        name: fullName,
        email,
        role,
      });
    } catch (emailError) {
      console.error("New account support notification failed:", emailError);
    }

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        message: "Account created. Check your email to verify your address.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
