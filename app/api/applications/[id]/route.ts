import type { ApplicationStatus } from "@/types";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import { mapApplicationRow } from "@/lib/data/projects";
import {
  clearAcceptedAuditionsForRoleActor,
  ensureAuditionForApplication,
  withdrawAuditionForRoleActor,
} from "@/lib/audition-sync";
import {
  applyAcceptedApplicationUpdate,
} from "@/lib/application-booking-offer";
import {
  assertCanSendBookingOffer,
} from "@/lib/casting-submission-actions";
import { assertCanBookActorForRole, ROLE_ALREADY_BOOKED_ERROR } from "@/lib/role-booking";
import { toPrismaApplicationStatus } from "@/lib/prisma-mappers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const patchSchema = z.object({
  status: z.enum([
    "submitted",
    "audition_viewed",
    "reviewing",
    "audition_requested",
    "callback",
    "rejected",
    "accepted",
  ]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const existing = await prisma.application.findFirst({
    where: { id, role: { project: { createdById: sessionOrError.user.id } } },
    include: { role: true, actor: { select: { id: true } } },
  });
  if (!existing) return apiError("Application not found", 404);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const status = parsed.data.status as ApplicationStatus;
  const wasAuditionRequested = existing.status === "AUDITION_REQUESTED";

  if (status === "accepted") {
    try {
      await assertCanSendBookingOffer(existing.roleId, existing.actorId);
      await assertCanBookActorForRole(existing.roleId, existing.actorId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ROLE_ALREADY_BOOKED_ERROR;
      return apiError(message, 400);
    }
  }

  const application =
    status === "accepted"
      ? await applyAcceptedApplicationUpdate(
          id,
          toPrismaApplicationStatus(status),
        )
      : await prisma.application.update({
          where: { id },
          data: {
            status: toPrismaApplicationStatus(status) as "SUBMITTED",
          },
        });

  const applicationWithRole = await prisma.application.findUniqueOrThrow({
    where: { id: application.id },
    include: {
      role: {
        include: { project: { select: { title: true, productionCompany: true } } },
      },
    },
  });

  if (status === "audition_requested") {
    await ensureAuditionForApplication(id);
  } else if (status === "rejected") {
    await clearAcceptedAuditionsForRoleActor(existing.roleId, existing.actorId);
    if (wasAuditionRequested) {
      await withdrawAuditionForRoleActor(existing.roleId, existing.actorId);
    }
  } else if (wasAuditionRequested && status !== "accepted") {
    await withdrawAuditionForRoleActor(existing.roleId, existing.actorId);
  } else if (status === "accepted") {
    await prisma.audition.updateMany({
      where: { roleId: existing.roleId, actorId: existing.actorId },
      data: { status: "ACCEPTED" },
    });
  }

  await prisma.notification.create({
    data: {
      userId: existing.actorId,
      category: "APPLICATIONS",
      title: "Application update",
      message: `Your submission for ${existing.role.characterName} was updated.`,
    },
  });

  return apiSuccess({ application: mapApplicationRow(applicationWithRole) });
}
