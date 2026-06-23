import { prisma } from "@/lib/prisma";

export const ROLE_ALREADY_BOOKED_ERROR =
  "This role already has a booked actor. Decline the current booking to book someone else.";

export async function getBookedActorIdForRole(roleId: string): Promise<string | null> {
  const bookedApplication = await prisma.application.findFirst({
    where: { roleId, status: "ACCEPTED" },
    select: { actorId: true },
  });
  if (bookedApplication) return bookedApplication.actorId;

  const bookedAudition = await prisma.audition.findFirst({
    where: { roleId, status: "ACCEPTED" },
    select: { actorId: true },
  });
  return bookedAudition?.actorId ?? null;
}

export async function getBookedActorsByRoleForCasting(
  castingUserId: string,
): Promise<Record<string, string>> {
  const bookedByRole: Record<string, string> = {};

  const applications = await prisma.application.findMany({
    where: {
      status: "ACCEPTED",
      role: { project: { createdById: castingUserId } },
    },
    select: { roleId: true, actorId: true },
  });
  for (const application of applications) {
    bookedByRole[application.roleId] = application.actorId;
  }

  const auditions = await prisma.audition.findMany({
    where: { castingId: castingUserId, status: "ACCEPTED" },
    select: { roleId: true, actorId: true },
  });
  for (const audition of auditions) {
    if (!bookedByRole[audition.roleId]) {
      bookedByRole[audition.roleId] = audition.actorId;
    }
  }

  return bookedByRole;
}

export function roleHasBookedActorFromData(role: {
  applications?: { status: string; actorId?: string }[];
  auditions?: { status: string; actorId?: string }[];
}): boolean {
  return (
    role.applications?.some((application) => application.status === "ACCEPTED") ||
    role.auditions?.some((audition) => audition.status === "ACCEPTED") ||
    false
  );
}

export function getBookedActorIdFromData(role: {
  applications?: { status: string; actorId?: string }[];
  auditions?: { status: string; actorId?: string }[];
}): string | null {
  const bookedApplication = role.applications?.find(
    (application) => application.status === "ACCEPTED",
  );
  if (bookedApplication?.actorId) return bookedApplication.actorId;

  const bookedAudition = role.auditions?.find(
    (audition) => audition.status === "ACCEPTED",
  );
  return bookedAudition?.actorId ?? null;
}

export async function assertCanBookActorForRole(roleId: string, actorId: string) {
  const bookedActorId = await getBookedActorIdForRole(roleId);
  if (bookedActorId && bookedActorId !== actorId) {
    throw new Error(ROLE_ALREADY_BOOKED_ERROR);
  }
}
