import {
  findOrCreateConversation,
  sendConversationMessage,
} from "@/lib/data/conversations";
import { clearAcceptedAuditionsForRoleActor } from "@/lib/audition-sync";
import {
  assertCanSendBookingOffer,
} from "@/lib/casting-submission-actions";
import { assertCanBookActorForRole } from "@/lib/role-booking";
import { toPrismaApplicationStatus } from "@/lib/prisma-mappers";
import { prisma } from "@/lib/prisma";
import {
  applyAuditionReviewApplicationUpsert,
  markBookingOfferSent,
} from "@/lib/application-booking-offer";

type BookingTarget = {
  roleId: string;
  actorId: string;
  projectId: string;
  characterName: string;
};

async function resolveBookingTarget(
  castingUserId: string,
  applicationId?: string,
  auditionId?: string,
): Promise<BookingTarget | null> {
  if (applicationId) {
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        role: { project: { createdById: castingUserId } },
      },
      include: {
        role: { select: { id: true, characterName: true, projectId: true } },
      },
    });
    if (!application) return null;
    return {
      roleId: application.roleId,
      actorId: application.actorId,
      projectId: application.role.projectId,
      characterName: application.role.characterName,
    };
  }

  if (auditionId) {
    const audition = await prisma.audition.findFirst({
      where: { id: auditionId, castingId: castingUserId },
      include: {
        role: { select: { id: true, characterName: true, projectId: true } },
      },
    });
    if (!audition) return null;
    return {
      roleId: audition.roleId,
      actorId: audition.actorId,
      projectId: audition.role.projectId,
      characterName: audition.role.characterName,
    };
  }

  return null;
}

export async function bookActor({
  castingUserId,
  applicationId,
  auditionId,
  message,
}: {
  castingUserId: string;
  applicationId?: string;
  auditionId?: string;
  message: string;
}) {
  const target = await resolveBookingTarget(
    castingUserId,
    applicationId,
    auditionId,
  );
  if (!target) throw new Error("Submission not found");

  const trimmedMessage = message.trim();
  if (!trimmedMessage) throw new Error("Message is required");

  await assertCanSendBookingOffer(target.roleId, target.actorId);
  await assertCanBookActorForRole(target.roleId, target.actorId);

  await markBookingOfferSent(target.roleId, target.actorId);

  await prisma.audition.updateMany({
    where: { roleId: target.roleId, actorId: target.actorId },
    data: { status: "ACCEPTED" },
  });

  const conversation = await findOrCreateConversation(
    target.projectId,
    target.actorId,
    castingUserId,
  );
  await sendConversationMessage(conversation.id, castingUserId, trimmedMessage);

  try {
    await prisma.actorProfile.updateMany({
      where: { userId: target.actorId },
      data: { pendingBookedCelebration: true },
    });
  } catch {
    // Celebration flag is optional if migration has not been applied yet.
  }

  await prisma.notification.create({
    data: {
      userId: target.actorId,
      category: "APPLICATIONS",
      title: "You're booked!",
      message: `You've been booked for ${target.characterName}. Check your messages for details.`,
    },
  });
}

export async function persistAuditionReviewForCasting({
  castingUserId,
  auditionId,
  status,
}: {
  castingUserId: string;
  auditionId: string;
  status: string;
}) {
  const audition = await prisma.audition.findFirst({
    where: { id: auditionId, castingId: castingUserId },
    include: {
      role: { select: { characterName: true } },
    },
  });
  if (!audition) throw new Error("Audition not found");

  if (status === "accepted") {
    await assertCanSendBookingOffer(audition.roleId, audition.actorId);
    await assertCanBookActorForRole(audition.roleId, audition.actorId);
  }

  const prismaStatus = toPrismaApplicationStatus(
    status as import("@/types").ApplicationStatus,
  );

  await applyAuditionReviewApplicationUpsert({
    roleId: audition.roleId,
    actorId: audition.actorId,
    status: prismaStatus,
    accepted: status === "accepted",
  });

  if (status === "rejected") {
    await clearAcceptedAuditionsForRoleActor(audition.roleId, audition.actorId);
    await prisma.audition.update({
      where: { id: auditionId },
      data: { status: "DECLINED" },
    });
  } else if (status === "accepted") {
    await prisma.audition.update({
      where: { id: auditionId },
      data: { status: "ACCEPTED" },
    });
  }

  await prisma.notification.create({
    data: {
      userId: audition.actorId,
      category: "APPLICATIONS",
      title: "Application update",
      message: `Your submission for ${audition.role.characterName} was updated.`,
    },
  });
}
