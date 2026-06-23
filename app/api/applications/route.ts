import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireActorSession } from "@/lib/api/guards";
import {
  getApplicationsForActor,
  mapApplicationRow,
} from "@/lib/data/projects";
import { syncAllProjectLifecycleStatuses } from "@/lib/project-lifecycle";
import { roleAcceptsApplicationsServer } from "@/lib/role-acceptance-server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const createSchema = z.object({
  roleId: z.string().min(1),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string(),
        fileName: z.string(),
        fileUrl: z.string().optional(),
        fileType: z.string().optional(),
      }),
    )
    .optional(),
});

export async function GET() {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const applications = await getApplicationsForActor(sessionOrError.user.id);
  return apiSuccess({ applications });
}

export async function POST(request: Request) {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await syncAllProjectLifecycleStatuses();

  const role = await prisma.role.findUnique({
    where: { id: parsed.data.roleId },
    include: {
      project: { select: { status: true, submissionDeadline: true } },
      applications: { select: { status: true, actorId: true } },
      auditions: { select: { status: true, actorId: true } },
    },
  });

  if (
    !role ||
    !roleAcceptsApplicationsServer({
      roleStatus: role.status,
      roleSubmissionDeadline: role.submissionDeadline,
      projectStatus: role.project.status,
      projectSubmissionDeadline: role.project.submissionDeadline,
      applications: role.applications,
      auditions: role.auditions,
    })
  ) {
    return apiError("This role is not open for submissions.", 400);
  }

  const existing = await prisma.application.findUnique({
    where: {
      roleId_actorId: {
        roleId: parsed.data.roleId,
        actorId: sessionOrError.user.id,
      },
    },
  });

  if (existing) {
    return apiError("You have already submitted for this role.", 409);
  }

  const existingAudition = await prisma.audition.findFirst({
    where: {
      roleId: parsed.data.roleId,
      actorId: sessionOrError.user.id,
    },
    select: { id: true },
  });

  if (existingAudition) {
    return apiError("You already have an audition for this role.", 409);
  }

  const application = await prisma.application.create({
    data: {
      roleId: parsed.data.roleId,
      actorId: sessionOrError.user.id,
      notes: parsed.data.note,
      status: "SUBMITTED",
      submissionItems: parsed.data.items
        ? {
            create: parsed.data.items.map((item) => ({
              label: item.label,
              fileName: item.fileName,
              fileUrl: item.fileUrl,
              fileType: item.fileType,
            })),
          }
        : undefined,
    },
    include: {
      role: {
        include: { project: { select: { title: true, productionCompany: true } } },
      },
    },
  });

  const project = await prisma.project.findUnique({
    where: { id: role.projectId },
    select: { createdById: true },
  });

  await prisma.notification.create({
    data: {
      userId: project?.createdById ?? sessionOrError.user.id,
      category: "APPLICATIONS",
      title: "New submission",
      message: `New submission for ${role.characterName}.`,
    },
  });

  return apiSuccess({ application: mapApplicationRow(application) }, 201);
}
