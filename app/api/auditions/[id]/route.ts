import { z } from "zod";
import type { AuditionStatus } from "@/types";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireActorSession, requireCastingSession } from "@/lib/api/guards";
import { getAuditionById, mapAuditionRow } from "@/lib/data/projects";
import { actorWithdrawAudition } from "@/lib/audition-sync";
import { toPrismaAuditionStatus } from "@/lib/prisma-mappers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const patchSchema = z.object({
  status: z.enum(["requested", "submitted", "declined", "withdrawn"]).optional(),
  notes: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const audition = await getAuditionById(id);
  if (!audition) return apiError("Audition not found", 404);
  return apiSuccess({ audition });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const existing = await prisma.audition.findUnique({ where: { id } });
  if (!existing) return apiError("Audition not found", 404);

  const actorSession = await requireActorSession();
  const castingSession =
    actorSession instanceof NextResponse ? await requireCastingSession() : null;

  const session =
    actorSession instanceof NextResponse ? castingSession : actorSession;

  if (!session || session instanceof NextResponse) {
    return apiError("Unauthorized", 401);
  }

  const isActor = session.user.role === "ACTOR" && existing.actorId === session.user.id;
  const isCasting =
    session.user.role === "CASTING" && existing.castingId === session.user.id;

  if (!isActor && !isCasting) {
    return apiError("Forbidden", 403);
  }

  const status = parsed.data.status as AuditionStatus | undefined;
  const notes = parsed.data.notes?.trim();

  if (isActor && status === "withdrawn") {
    if (!notes) {
      return apiError("A decline reason is required.");
    }

    const withdrawn = await actorWithdrawAudition(id, session.user.id, notes);
    if (!withdrawn) {
      return apiError("Audition not found or cannot be withdrawn.", 404);
    }

    const audition = await getAuditionById(id);
    if (!audition) return apiError("Audition not found", 404);
    return apiSuccess({ audition });
  }

  if (isActor && status && status !== "withdrawn") {
    return apiError("Actors can only withdraw auditions", 403);
  }

  if (isCasting && status === "withdrawn") {
    return apiError("Casting cannot set withdrawn status", 403);
  }

  const audition = await prisma.audition.update({
    where: { id },
    data: {
      status: status ? (toPrismaAuditionStatus(status) as "REQUESTED") : undefined,
      notes: parsed.data.notes,
    },
    include: {
      role: {
        include: {
          project: {
            select: {
              title: true,
              location: true,
              shootDates: true,
              submissionDeadline: true,
            },
          },
        },
      },
      actor: {
        select: {
          name: true,
          actorProfile: {
            select: {
              profilePhotoUrl: true,
              headshots: { select: { url: true, featured: true } },
            },
          },
        },
      },
      casting: { select: { name: true } },
      submissionItems: true,
    },
  });

  return apiSuccess({ audition: mapAuditionRow(audition) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const existing = await prisma.audition.findFirst({
    where: { id, castingId: sessionOrError.user.id },
  });
  if (!existing) return apiError("Audition not found", 404);

  await prisma.audition.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
