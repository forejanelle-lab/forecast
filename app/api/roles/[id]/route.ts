import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import { getRoleById, mapRoleRow } from "@/lib/data/projects";
import { persistRoleAuditionFiles } from "@/lib/role-audition-persistence";
import { toPrismaRoleStatus } from "@/lib/prisma-mappers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const patchSchema = z.object({
  characterName: z.string().optional(),
  playingAge: z.string().optional(),
  gender: z.string().optional(),
  ethnicity: z.string().optional(),
  roleType: z.string().optional(),
  compensation: z.string().optional(),
  shootDates: z.string().optional(),
  submissionDeadline: z.string().nullable().optional(),
  description: z.string().optional(),
  auditionInstructions: z.string().optional(),
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
  status: z.enum(["open", "closed", "casting", "filled"]).optional(),
});

const roleInclude = {
  project: { select: { title: true } },
  applications: { select: { id: true } },
} as const;

function buildRoleFieldUpdateData(data: z.infer<typeof patchSchema>): Prisma.RoleUpdateInput {
  return {
    characterName: data.characterName,
    playingAge: data.playingAge,
    gender: data.gender,
    ethnicity: data.ethnicity,
    roleType: data.roleType,
    compensation: data.compensation,
    shootDates: data.shootDates,
    submissionDeadline:
      data.submissionDeadline === null
        ? null
        : data.submissionDeadline
          ? new Date(data.submissionDeadline)
          : undefined,
    description: data.description,
    auditionInstructions: data.auditionInstructions,
    status: data.status
      ? (toPrismaRoleStatus(data.status) as "OPEN")
      : undefined,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const role = await getRoleById(id);
  if (!role) return apiError("Role not found", 404);
  return apiSuccess({ role });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const existing = await prisma.role.findFirst({
    where: { id, project: { createdById: sessionOrError.user.id } },
  });
  if (!existing) return apiError("Role not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body. Uploaded files may be too large.");
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const data = parsed.data;

  try {
    await prisma.role.update({
      where: { id },
      data: buildRoleFieldUpdateData(data),
    });

    let materialsWarning: string | undefined;
    if (data.auditionFiles !== undefined) {
      try {
        await persistRoleAuditionFiles(id, data.auditionFiles);
      } catch (materialsError) {
        console.error("Failed to persist role audition files:", materialsError);
        materialsWarning =
          "Role details saved, but audition materials could not be saved. Try again or remove large files.";
      }
    }

    const role = await prisma.role.findUniqueOrThrow({
      where: { id },
      include: roleInclude,
    });

    return apiSuccess({
      role: mapRoleRow(role),
      materialsWarning,
    });
  } catch (error) {
    console.error("Failed to update role:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save role. Please try again.";
    return apiError(message, 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const existing = await prisma.role.findFirst({
    where: { id, project: { createdById: sessionOrError.user.id } },
  });
  if (!existing) return apiError("Role not found", 404);

  await prisma.role.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
