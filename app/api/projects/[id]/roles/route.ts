import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import { getRolesForProject, mapRoleRow } from "@/lib/data/projects";
import { persistRoleAuditionMaterialBytesFromFiles } from "@/lib/role-audition-material-files-server";
import { sanitizeRoleAuditionFilesForDb, parseRoleAuditionFiles } from "@/lib/role-audition-files";
import { recordBusinessEvent } from "@/lib/analytics/record";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const createSchema = z.object({
  characterName: z.string().min(1),
  playingAge: z.string().optional(),
  gender: z.string().optional(),
  ethnicity: z.string().optional(),
  roleType: z.string().optional(),
  compensation: z.string().optional(),
  shootDates: z.string().optional(),
  submissionDeadline: z.string().optional(),
  description: z.string().trim().min(1, "Role description is required"),
  auditionInstructions: z.string().trim().min(1, "Audition instructions are required"),
  auditionFiles: z
    .array(
      z.object({
        label: z.string(),
        fileName: z.string(),
        type: z.enum(["video", "audio", "image", "document"]),
        fileUrl: z.string().optional(),
      }),
    )
    .optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, createdById: sessionOrError.user.id },
  });
  if (!project) return apiError("Project not found", 404);

  const roles = await getRolesForProject(id);
  return apiSuccess({ roles });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, createdById: sessionOrError.user.id },
  });
  if (!project) return apiError("Project not found", 404);

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const data = parsed.data;
  const role = await prisma.role.create({
    data: {
      projectId: id,
      characterName: data.characterName,
      playingAge: data.playingAge,
      gender: data.gender,
      ethnicity: data.ethnicity,
      roleType: data.roleType,
      compensation: data.compensation,
      shootDates: data.shootDates,
      submissionDeadline: data.submissionDeadline
        ? new Date(data.submissionDeadline)
        : undefined,
      description: data.description,
      auditionInstructions: data.auditionInstructions,
      auditionFiles: data.auditionFiles
        ? sanitizeRoleAuditionFilesForDb(data.auditionFiles)
        : undefined,
      status: "OPEN",
    },
    include: {
      project: { select: { title: true } },
      applications: { select: { id: true } },
    },
  });

  if (data.auditionFiles?.length) {
    try {
      await persistRoleAuditionMaterialBytesFromFiles(
        role.id,
        parseRoleAuditionFiles(role.auditionFiles),
      );
    } catch (error) {
      console.error("Failed to persist role audition material bytes on create:", error);
    }
  }

  void recordBusinessEvent({
    eventType: "ROLE_CREATION",
    userId: sessionOrError.user.id,
    userRole: sessionOrError.user.role,
    metadata: { projectId: id, roleId: role.id },
  });

  return apiSuccess({ role: mapRoleRow(role) }, 201);
}
