import { formatDateOnly } from "@/lib/prisma-mappers";
import { prisma } from "@/lib/prisma";

export async function markActorPendingAuditionCelebration(actorId: string) {
  try {
    await prisma.actorProfile.updateMany({
      where: { userId: actorId },
      data: { pendingAuditionCelebration: true },
    });
  } catch {
    // Celebration flag is optional if migration has not been applied yet.
  }
}

export async function getActorAuditionCelebration(actorId: string) {
  const profile = await prisma.actorProfile.findUnique({
    where: { userId: actorId },
    select: { pendingAuditionCelebration: true },
  });

  if (!profile?.pendingAuditionCelebration) {
    return { pending: false };
  }

  const requestedAuditions = await prisma.audition.findMany({
    where: { actorId, status: "REQUESTED" },
    orderBy: { requestedAt: "desc" },
    take: 5,
    include: {
      role: { include: { project: { select: { title: true } } } },
      casting: { select: { name: true } },
    },
  });

  if (requestedAuditions.length === 0) {
    await clearActorAuditionCelebration(actorId);
    return { pending: false };
  }

  const latest = requestedAuditions[0];

  return {
    pending: true,
    requestedCount: requestedAuditions.length,
    audition: {
      id: latest.id,
      roleName: latest.role.characterName,
      projectTitle: latest.role.project.title,
      deadline: formatDateOnly(latest.deadline),
      castingDirector: latest.casting.name ?? "Casting Director",
    },
  };
}

export async function clearActorAuditionCelebration(actorId: string) {
  try {
    await prisma.actorProfile.updateMany({
      where: { userId: actorId },
      data: { pendingAuditionCelebration: false },
    });
  } catch {
    // Celebration flag is optional if migration has not been applied yet.
  }
}
