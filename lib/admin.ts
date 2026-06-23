import { auth } from "@/auth";
import { apiError } from "@/lib/auth-helpers";
import { isAdminEmail } from "@/lib/admin-access";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";

export async function requireAdminSession(): Promise<Session | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }

  if (!isAdminEmail(session.user.email)) {
    return apiError("Forbidden", 403);
  }

  return session;
}
