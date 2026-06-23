import { auth } from "@/auth";
import type { AppUserRole } from "@/auth.config";
import { apiError } from "@/lib/auth-helpers";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";

export async function requireAuthSession(): Promise<Session | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }
  return session;
}

export async function requireRole(
  role: AppUserRole,
): Promise<Session | NextResponse> {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  if (sessionOrError.user.role !== role) {
    return apiError("Forbidden", 403);
  }

  return sessionOrError;
}

export async function requireActorSession(): Promise<Session | NextResponse> {
  return requireRole("ACTOR");
}

export async function requireCastingSession(): Promise<Session | NextResponse> {
  return requireRole("CASTING");
}
