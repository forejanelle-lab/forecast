import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireActorSession } from "@/lib/api/guards";
import { clearActorAuditionCelebration } from "@/lib/actor-celebration";
import { mapAuditionRow } from "@/lib/data/projects";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const schema = z.object({
  items: z.array(
    z.object({
      label: z.string(),
      fileName: z.string(),
      fileUrl: z.string().optional(),
    }),
  ),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const existing = await prisma.audition.findFirst({
    where: { id, actorId: sessionOrError.user.id },
  });
  if (!existing) return apiError("Audition not found", 404);

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.auditionSubmissionItem.deleteMany({ where: { auditionId: id } });
  await prisma.auditionSubmissionItem.createMany({
    data: parsed.data.items.map((item) => ({
      auditionId: id,
      label: item.label,
      fileName: item.fileName,
      fileUrl: item.fileUrl,
    })),
  });

  const audition = await prisma.audition.update({
    where: { id },
    data: { status: "SUBMITTED" },
    include: {
      role: { include: { project: { select: { title: true } } } },
      actor: { select: { name: true } },
      casting: { select: { name: true } },
      submissionItems: true,
    },
  });

  await prisma.application.updateMany({
    where: {
      roleId: existing.roleId,
      actorId: existing.actorId,
      status: "AUDITION_REQUESTED",
    },
    data: { status: "REVIEWING" },
  });

  await clearActorAuditionCelebration(sessionOrError.user.id);

  await prisma.notification.create({
    data: {
      userId: existing.castingId,
      category: "AUDITIONS",
      title: "Audition submitted",
      message: "An actor submitted their audition materials.",
    },
  });

  return apiSuccess({ audition: mapAuditionRow(audition) });
}
