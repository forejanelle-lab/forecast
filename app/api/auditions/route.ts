import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireAuthSession, requireCastingSession } from "@/lib/api/guards";
import {
  getAuditionsForActor,
  getAuditionsForCasting,
  mapAuditionRow,
} from "@/lib/data/projects";
import { markActorPendingAuditionCelebration } from "@/lib/actor-celebration";
import { parseOptionalDate } from "@/lib/audition-sync";
import { isAuditionDeadlineInPast } from "@/lib/audition-utils";
import {
  AUDITION_ALREADY_REQUESTED_ERROR,
} from "@/lib/casting-submission-actions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const createSchema = z.object({
  roleId: z.string().min(1),
  actorId: z.string().min(1),
  deadline: z.string().optional(),
  location: z.string().optional(),
  instructions: z.string().optional(),
  scenes: z.array(z.string()).optional(),
  uploadRequirements: z.array(z.string()).optional(),
});

export async function GET() {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  if (sessionOrError.user.role === "CASTING") {
    const auditions = await getAuditionsForCasting(sessionOrError.user.id);
    return apiSuccess({ auditions });
  }

  const auditions = await getAuditionsForActor(sessionOrError.user.id);
  return apiSuccess({ auditions });
}

export async function POST(request: Request) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const role = await prisma.role.findFirst({
    where: {
      id: parsed.data.roleId,
      project: { createdById: sessionOrError.user.id },
    },
  });
  if (!role) return apiError("Role not found", 404);

  if (parsed.data.deadline && isAuditionDeadlineInPast(parsed.data.deadline)) {
    return apiError("Audition deadline cannot be in the past.");
  }

  const existingAudition = await prisma.audition.findFirst({
    where: {
      roleId: parsed.data.roleId,
      actorId: parsed.data.actorId,
    },
  });

  if (existingAudition) {
    return apiError(AUDITION_ALREADY_REQUESTED_ERROR, 400);
  }

  const audition = await prisma.audition.create({
    data: {
      roleId: parsed.data.roleId,
      actorId: parsed.data.actorId,
      castingId: sessionOrError.user.id,
      status: "REQUESTED",
      deadline: parseOptionalDate(parsed.data.deadline),
      location: parsed.data.location,
      instructions: parsed.data.instructions,
      scenes: parsed.data.scenes ?? [],
      uploadRequirements: parsed.data.uploadRequirements ?? [],
    },
    include: {
      role: { include: { project: { select: { title: true } } } },
      actor: { select: { name: true } },
      casting: { select: { name: true } },
      submissionItems: true,
    },
  });

  await prisma.application.updateMany({
    where: { roleId: parsed.data.roleId, actorId: parsed.data.actorId },
    data: { status: "AUDITION_REQUESTED" },
  });

  await prisma.notification.create({
    data: {
      userId: parsed.data.actorId,
      category: "AUDITIONS",
      title: "Audition request",
      message: `You've been requested to audition for ${role.characterName}.`,
    },
  });

  await markActorPendingAuditionCelebration(parsed.data.actorId);

  return apiSuccess({ audition: mapAuditionRow(audition) }, 201);
}
