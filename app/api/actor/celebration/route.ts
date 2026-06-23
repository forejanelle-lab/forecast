import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireActorSession } from "@/lib/api/guards";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const profile = await prisma.actorProfile.findUnique({
    where: { userId: sessionOrError.user.id },
    select: { pendingBookedCelebration: true },
  });

  return apiSuccess({
    pending: profile?.pendingBookedCelebration ?? false,
  });
}

export async function POST() {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  await prisma.actorProfile.updateMany({
    where: { userId: sessionOrError.user.id },
    data: { pendingBookedCelebration: false },
  });

  return apiSuccess({ ok: true });
}
