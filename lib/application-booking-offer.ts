import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ApplicationBookingRow = {
  status: string;
  bookingOfferSentAt?: Date | null;
};

function isBookingOfferFieldError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientValidationError) {
    return error.message.includes("bookingOfferSentAt");
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2022") {
      return error.message.includes("bookingOfferSentAt");
    }
  }

  if (!(error instanceof Error)) return false;
  const message = error.message;
  return (
    message.includes("bookingOfferSentAt") ||
    message.includes("Unknown field") ||
    message.includes("Unknown argument") ||
    message.includes("does not exist")
  );
}

export function applicationHasBookingOfferSent(application: ApplicationBookingRow): boolean {
  return (
    Boolean(application.bookingOfferSentAt) ||
    application.status === "ACCEPTED" ||
    application.status === "accepted"
  );
}

export async function readBookingOfferSent(
  roleId: string,
  actorId: string,
): Promise<boolean> {
  try {
    const application = await prisma.application.findUnique({
      where: { roleId_actorId: { roleId, actorId } },
      select: { status: true, bookingOfferSentAt: true },
    });
    if (!application) return false;
    return applicationHasBookingOfferSent(application);
  } catch (error) {
    if (!isBookingOfferFieldError(error)) throw error;

    const application = await prisma.application.findUnique({
      where: { roleId_actorId: { roleId, actorId } },
      select: { status: true },
    });
    return applicationHasBookingOfferSent(application ?? { status: "" });
  }
}

export async function markBookingOfferSent(roleId: string, actorId: string) {
  const timestamp = new Date();

  try {
    await prisma.application.upsert({
      where: { roleId_actorId: { roleId, actorId } },
      create: {
        roleId,
        actorId,
        status: "ACCEPTED",
        bookingOfferSentAt: timestamp,
      },
      update: { status: "ACCEPTED", bookingOfferSentAt: timestamp },
    });
  } catch (error) {
    if (!isBookingOfferFieldError(error)) throw error;

    await prisma.application.upsert({
      where: { roleId_actorId: { roleId, actorId } },
      create: {
        roleId,
        actorId,
        status: "ACCEPTED",
      },
      update: { status: "ACCEPTED" },
    });
  }
}

export async function applyAcceptedApplicationUpdate(
  applicationId: string,
  status: string,
) {
  const timestamp = new Date();

  try {
    return await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: status as "ACCEPTED",
        bookingOfferSentAt: timestamp,
      },
    });
  } catch (error) {
    if (!isBookingOfferFieldError(error)) throw error;

    return await prisma.application.update({
      where: { id: applicationId },
      data: { status: status as "ACCEPTED" },
    });
  }
}

export async function applyAuditionReviewApplicationUpsert(input: {
  roleId: string;
  actorId: string;
  status: string;
  accepted: boolean;
}) {
  const timestamp = new Date();

  try {
    return await prisma.application.upsert({
      where: {
        roleId_actorId: { roleId: input.roleId, actorId: input.actorId },
      },
      create: {
        roleId: input.roleId,
        actorId: input.actorId,
        status: input.status as "SUBMITTED",
        bookingOfferSentAt: input.accepted ? timestamp : undefined,
      },
      update: {
        status: input.status as "SUBMITTED",
        ...(input.accepted ? { bookingOfferSentAt: timestamp } : {}),
      },
    });
  } catch (error) {
    if (!isBookingOfferFieldError(error)) throw error;

    return await prisma.application.upsert({
      where: {
        roleId_actorId: { roleId: input.roleId, actorId: input.actorId },
      },
      create: {
        roleId: input.roleId,
        actorId: input.actorId,
        status: input.status as "SUBMITTED",
      },
      update: { status: input.status as "SUBMITTED" },
    });
  }
}

export async function getBookingOfferSentKeysForCasting(
  castingUserId: string,
): Promise<Set<string>> {
  try {
    const applications = await prisma.application.findMany({
      where: {
        bookingOfferSentAt: { not: null },
        role: { project: { createdById: castingUserId } },
      },
      select: { roleId: true, actorId: true },
    });
    return new Set(
      applications.map((application) => `${application.roleId}:${application.actorId}`),
    );
  } catch (error) {
    if (!isBookingOfferFieldError(error)) throw error;

    const applications = await prisma.application.findMany({
      where: {
        status: "ACCEPTED",
        role: { project: { createdById: castingUserId } },
      },
      select: { roleId: true, actorId: true, status: true },
    });
    return new Set(
      applications
        .filter((application) => applicationHasBookingOfferSent(application))
        .map((application) => `${application.roleId}:${application.actorId}`),
    );
  }
}
