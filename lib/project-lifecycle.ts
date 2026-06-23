import { isSubmissionDeadlinePassed } from "@/lib/message-rules";
import { formatDateOnly } from "@/lib/prisma-mappers";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@/types";

type PrismaProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "COMPLETED";

export function isProjectOpenForDeadline(submissionDeadline: Date | string | null): boolean {
  if (!submissionDeadline) return true;
  const deadline =
    submissionDeadline instanceof Date
      ? formatDateOnly(submissionDeadline)
      : submissionDeadline.trim();
  if (!deadline) return true;
  return !isSubmissionDeadlinePassed(deadline);
}

export function isProjectOpenForActorSubmissions(
  status: ProjectStatus,
  submissionDeadline: string,
): boolean {
  if (status !== "active") return false;
  if (!submissionDeadline?.trim()) return true;
  return !isSubmissionDeadlinePassed(submissionDeadline);
}

/** Keep stored status aligned with casting end date (except draft/completed). */
export function resolvePrismaProjectStatusForDeadline(
  currentStatus: PrismaProjectStatus,
  submissionDeadline: Date | null,
  explicitStatus?: PrismaProjectStatus,
): PrismaProjectStatus {
  if (explicitStatus) return explicitStatus;
  if (currentStatus === "DRAFT" || currentStatus === "COMPLETED") return currentStatus;

  const open = isProjectOpenForDeadline(submissionDeadline);

  if (open && currentStatus === "ARCHIVED") return "ACTIVE";
  if (!open && currentStatus === "ACTIVE") return "ARCHIVED";
  return currentStatus;
}

/** Fix legacy rows set to CLOSED before ProjectStatus dropped that enum value. */
export async function repairLegacyClosedProjectStatuses(): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "Project"
      SET status = CAST('ARCHIVED' AS "ProjectStatus"), "updatedAt" = CURRENT_TIMESTAMP
      WHERE status::text = 'CLOSED'
    `;
  } catch (error) {
    console.error("Failed to repair legacy CLOSED project statuses:", error);
  }
}

export async function closeRolesForExpiredProject(projectId: string): Promise<void> {
  await prisma.role.updateMany({
    where: { projectId, status: "OPEN" },
    data: { status: "CLOSED" },
  });
}

export async function reopenClosedRolesForProject(projectId: string): Promise<void> {
  await prisma.role.updateMany({
    where: { projectId, status: "CLOSED" },
    data: { status: "OPEN" },
  });
}

/** Archive active projects past casting end date (does not reopen manual archives). */
export async function syncAllProjectLifecycleStatuses(): Promise<void> {
  await repairLegacyClosedProjectStatuses();

  const activeProjects = await prisma.project.findMany({
    where: {
      status: "ACTIVE",
      submissionDeadline: { not: null },
    },
    select: { id: true, submissionDeadline: true },
  });

  for (const project of activeProjects) {
    if (isProjectOpenForDeadline(project.submissionDeadline)) continue;

    await prisma.project.update({
      where: { id: project.id },
      data: { status: "ARCHIVED" },
    });
    await closeRolesForExpiredProject(project.id);
  }
}

/** @deprecated Use syncAllProjectLifecycleStatuses */
export async function closeExpiredActiveProjects(): Promise<void> {
  await syncAllProjectLifecycleStatuses();
}
