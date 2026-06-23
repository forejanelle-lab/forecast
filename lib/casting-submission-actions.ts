import { readBookingOfferSent } from "@/lib/application-booking-offer";
import { prisma } from "@/lib/prisma";

export const AUDITION_ALREADY_REQUESTED_ERROR =
  "An audition was already requested for this actor on this role. Message the actor to coordinate any changes.";

export const BOOKING_ALREADY_SENT_ERROR =
  "A booking offer was already sent for this actor on this role. Message the actor to coordinate any changes.";

export async function hasAuditionBeenRequested(roleId: string, actorId: string): Promise<boolean> {
  const audition = await prisma.audition.findFirst({
    where: { roleId, actorId },
    select: { id: true },
  });
  return Boolean(audition);
}

export async function assertCanRequestAudition(roleId: string, actorId: string) {
  if (await hasAuditionBeenRequested(roleId, actorId)) {
    throw new Error(AUDITION_ALREADY_REQUESTED_ERROR);
  }
}

export async function hasBookingOfferBeenSent(roleId: string, actorId: string): Promise<boolean> {
  return readBookingOfferSent(roleId, actorId);
}

export async function assertCanSendBookingOffer(roleId: string, actorId: string) {
  if (await hasBookingOfferBeenSent(roleId, actorId)) {
    throw new Error(BOOKING_ALREADY_SENT_ERROR);
  }
}

export async function getAuditionRequestedRoleIdsForActor(
  actorId: string,
  castingUserId: string,
): Promise<Set<string>> {
  const auditions = await prisma.audition.findMany({
    where: { actorId, castingId: castingUserId },
    select: { roleId: true },
  });
  return new Set(auditions.map((audition) => audition.roleId));
}

export { getBookingOfferSentKeysForCasting } from "@/lib/application-booking-offer";
