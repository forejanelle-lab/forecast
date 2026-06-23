import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import { getSubmissionsForRole } from "@/lib/data/projects";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id: roleId } = await params;
  const role = await prisma.role.findFirst({
    where: { id: roleId, project: { createdById: sessionOrError.user.id } },
  });
  if (!role) return apiError("Role not found", 404);

  const submissions = await getSubmissionsForRole(roleId);
  return apiSuccess({ submissions });
}
