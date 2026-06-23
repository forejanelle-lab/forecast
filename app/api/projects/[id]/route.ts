import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import { getProjectByIdForCasting } from "@/lib/data/projects";
import { formatDateOnly, toPrismaProjectStatus } from "@/lib/prisma-mappers";
import {
  closeRolesForExpiredProject,
  reopenClosedRolesForProject,
  resolvePrismaProjectStatusForDeadline,
} from "@/lib/project-lifecycle";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const patchSchema = z.object({
  title: z.string().optional(),
  productionCompany: z.string().optional(),
  projectType: z.string().optional(),
  unionStatus: z.string().optional(),
  location: z.string().optional(),
  submissionDeadline: z.string().nullable().optional(),
  shootDates: z.string().optional(),
  compensation: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "archived", "completed"]).optional(),
});

type PrismaProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "COMPLETED";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const project = await getProjectByIdForCasting(id, sessionOrError.user.id);
  if (!project) return apiError("Project not found", 404);

  return apiSuccess({ project });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const existing = await prisma.project.findFirst({
    where: { id, createdById: sessionOrError.user.id },
  });
  if (!existing) return apiError("Project not found", 404);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const data = parsed.data;
  const mergedDeadline =
    data.submissionDeadline !== undefined
      ? data.submissionDeadline
        ? new Date(data.submissionDeadline)
        : null
      : existing.submissionDeadline;

  const explicitStatus = data.status
    ? (toPrismaProjectStatus(data.status) as PrismaProjectStatus)
    : undefined;

  const deadlineChanged =
    data.submissionDeadline !== undefined &&
    formatDateOnly(mergedDeadline) !== formatDateOnly(existing.submissionDeadline);

  const resolvedStatus = resolvePrismaProjectStatusForDeadline(
    existing.status as PrismaProjectStatus,
    mergedDeadline,
    explicitStatus ??
      (!deadlineChanged ? (existing.status as PrismaProjectStatus) : undefined),
  );

  await prisma.project.update({
    where: { id },
    data: {
      title: data.title,
      productionCompany: data.productionCompany,
      projectType: data.projectType,
      unionStatus: data.unionStatus,
      location: data.location,
      submissionDeadline:
        data.submissionDeadline !== undefined ? mergedDeadline : undefined,
      shootDates: data.shootDates,
      compensation: data.compensation,
      description: data.description,
      status: resolvedStatus,
    },
  });

  if (resolvedStatus === "ACTIVE" && existing.status !== "ACTIVE") {
    await reopenClosedRolesForProject(id);
  } else if (resolvedStatus === "ARCHIVED" && existing.status === "ACTIVE") {
    await closeRolesForExpiredProject(id);
  }

  const project = await getProjectByIdForCasting(id, sessionOrError.user.id);
  return apiSuccess({ project });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const existing = await prisma.project.findFirst({
    where: { id, createdById: sessionOrError.user.id },
  });
  if (!existing) return apiError("Project not found", 404);

  await prisma.project.delete({ where: { id } });
  return apiSuccess({ message: "Project deleted." });
}
