import type { Session } from "next-auth";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmailVerified(
  emailVerified: Date | null | undefined | boolean,
): boolean {
  if (typeof emailVerified === "boolean") return emailVerified;
  return emailVerified != null;
}

export async function requireSession(): Promise<
  Session | NextResponse
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T extends Record<string, unknown>>(
  data: T,
  status = 200,
) {
  return NextResponse.json({ success: true, ...data }, { status });
}
