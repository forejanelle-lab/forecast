import { defaultRoleAuditionPackage } from "@/lib/default-role-audition-package";
import { markActorPendingAuditionCelebration } from "@/lib/actor-celebration";
import { parseCalendarDate } from "@/lib/audition-utils";
import { prisma } from "@/lib/prisma";

export function parseOptionalDate(value: string | undefined | null): Date | undefined {
  if (!value?.trim()) return undefined;
  return parseCalendarDate(value.trim());
}

const auditionInclude = {
  role: { include: { project: { select: { title: true } } } },
  actor: { select: { name: true } },
  casting: { select: { name: true } },
  submissionItems: true,
} as const;

type AuditionSyncInput = {
  roleId: string;
  actorId: string;
  castingId: string;
  deadline?: Date | null;
  instructions?: string | null;
  scenes?: string[];
  uploadRequirements?: string[];
  requestedAt?: Date;
};

export async function clearAcceptedAuditionsForRoleActor(roleId: string, actorId: string) {
  await prisma.audition.updateMany({
    where: { roleId, actorId, status: "ACCEPTED" },
    data: { status: "DECLINED" },
  });
}

export async function withdrawAuditionForRoleActor(roleId: string, actorId: string) {
  const audition = await prisma.audition.findFirst({
    where: {
      actorId,
      roleId,
      status: { in: ["REQUESTED", "SUBMITTED"] },
    },
  });
  if (!audition) return;

  await prisma.audition.update({
    where: { id: audition.id },
    data: { status: "WITHDRAWN" },
  });
}

export async function actorWithdrawAudition(
  auditionId: string,
  actorId: string,
  notes: string,
): Promise<{ castingId: string; actorName: string; characterName: string } | null> {
  const audition = await prisma.audition.findFirst({
    where: {
      id: auditionId,
      actorId,
      status: { in: ["REQUESTED", "SUBMITTED"] },
    },
    include: {
      role: { select: { characterName: true } },
      actor: { select: { name: true } },
    },
  });

  if (!audition) return null;

  await prisma.audition.update({
    where: { id: audition.id },
    data: { status: "WITHDRAWN", notes: notes.trim() },
  });

  await prisma.application.updateMany({
    where: {
      roleId: audition.roleId,
      actorId: audition.actorId,
      status: "AUDITION_REQUESTED",
    },
    data: { status: "SUBMITTED" },
  });

  const actorName = audition.actor.name?.trim() || "An actor";
  const characterName = audition.role.characterName;

  await prisma.notification.create({
    data: {
      userId: audition.castingId,
      category: "AUDITIONS",
      title: "Audition declined",
      message: `${actorName} declined the audition for ${characterName}: ${notes.trim()}`,
    },
  });

  return {
    castingId: audition.castingId,
    actorName,
    characterName,
  };
}

export async function reactivateAuditionForRoleActor(
  input: AuditionSyncInput,
  options?: { allowReactivateWithdrawn?: boolean },
) {
  const existing = await prisma.audition.findFirst({
    where: { actorId: input.actorId, roleId: input.roleId },
  });

  if (!existing) {
    const audition = await prisma.audition.create({
      data: {
        roleId: input.roleId,
        actorId: input.actorId,
        castingId: input.castingId,
        status: "REQUESTED",
        deadline: input.deadline ?? undefined,
        instructions:
          input.instructions?.trim() || defaultRoleAuditionPackage.instructions,
        scenes: input.scenes ?? defaultRoleAuditionPackage.scenes,
        uploadRequirements:
          input.uploadRequirements ?? defaultRoleAuditionPackage.uploadRequirements,
        requestedAt: input.requestedAt ?? undefined,
      },
      include: auditionInclude,
    });
    await markActorPendingAuditionCelebration(input.actorId);
    return audition;
  }

  if (
    existing.status === "SUBMITTED" ||
    existing.status === "ACCEPTED" ||
    existing.status === "COMPLETED" ||
    existing.status === "DECLINED"
  ) {
    return prisma.audition.findUniqueOrThrow({
      where: { id: existing.id },
      include: auditionInclude,
    });
  }

  if (existing.status === "WITHDRAWN" && !options?.allowReactivateWithdrawn) {
    return prisma.audition.findUniqueOrThrow({
      where: { id: existing.id },
      include: auditionInclude,
    });
  }

  const wasRequested = existing.status === "REQUESTED";

  if (existing.status !== "REQUESTED") {
    await prisma.auditionSubmissionItem.deleteMany({
      where: { auditionId: existing.id },
    });
  }

  const audition = await prisma.audition.update({
    where: { id: existing.id },
    data: {
      status: "REQUESTED",
      castingId: input.castingId,
      deadline: existing.deadline ?? input.deadline ?? undefined,
      instructions:
        input.instructions?.trim() ||
        existing.instructions ||
        defaultRoleAuditionPackage.instructions,
      scenes: input.scenes ?? existing.scenes,
      uploadRequirements: input.uploadRequirements ?? existing.uploadRequirements,
      requestedAt: input.requestedAt ?? new Date(),
    },
    include: auditionInclude,
  });

  if (!wasRequested) {
    await markActorPendingAuditionCelebration(input.actorId);
  }

  return audition;
}

export async function ensureAuditionForApplication(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      role: {
        include: { project: { select: { createdById: true } } },
      },
    },
  });

  if (!application || application.status !== "AUDITION_REQUESTED") return;

  await reactivateAuditionForRoleActor(
    {
      roleId: application.roleId,
      actorId: application.actorId,
      castingId: application.role.project.createdById,
      deadline: application.role.submissionDeadline,
      instructions: application.role.auditionInstructions,
      requestedAt: application.updatedAt,
    },
    { allowReactivateWithdrawn: true },
  );
}

export async function syncAuditionsFromApplications(actorId: string) {
  const applications = await prisma.application.findMany({
    where: { actorId, status: "AUDITION_REQUESTED" },
    include: {
      role: {
        include: { project: { select: { createdById: true } } },
      },
    },
  });

  for (const application of applications) {
    await reactivateAuditionForRoleActor({
      roleId: application.roleId,
      actorId: application.actorId,
      castingId: application.role.project.createdById,
      deadline: application.role.submissionDeadline,
      instructions: application.role.auditionInstructions,
      requestedAt: application.updatedAt,
    });
  }
}
