import { NextResponse } from "next/server";
import {
  isEnvPlaceholder,
  validateDatabaseEnv,
} from "@/lib/db-config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (
    isEnvPlaceholder(process.env.DATABASE_URL) ||
    isEnvPlaceholder(process.env.DIRECT_URL)
  ) {
    return NextResponse.json({
      ok: false,
      reason: "placeholder_env",
      message:
        "Update .env with your Supabase DATABASE_URL and DIRECT_URL (replace [PROJECT-REF] and [PASSWORD]).",
    });
  }

  try {
    validateDatabaseEnv();
  } catch (error) {
    return NextResponse.json({
      ok: false,
      reason: "invalid_env",
      message: error instanceof Error ? error.message : "Invalid database configuration.",
    });
  }

  try {
    const demoUser = await prisma.user.findUnique({
      where: { email: "maya@forecast.com" },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      demoUserExists: !!demoUser,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      reason: "connection_failed",
      message:
        error instanceof Error
          ? error.message
          : "Could not connect to the database. Check your Supabase credentials.",
    });
  }
}
