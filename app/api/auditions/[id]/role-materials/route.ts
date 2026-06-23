import { apiError } from "@/lib/auth-helpers";
import { requireActorSession } from "@/lib/api/guards";
import { parseRoleAuditionFiles } from "@/lib/role-audition-files";
import { resolveRoleMaterialBytes } from "@/lib/role-audition-material-files-server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const fileName = new URL(request.url).searchParams.get("fileName");

  const audition = await prisma.audition.findFirst({
    where: { id, actorId: sessionOrError.user.id },
    include: {
      role: { select: { id: true, auditionFiles: true } },
    },
  });

  if (!audition) return apiError("Audition not found", 404);

  const materials = parseRoleAuditionFiles(audition.role.auditionFiles);

  if (!fileName) {
    return NextResponse.json({ materials });
  }

  const material = materials.find((file) => file.fileName === fileName);
  if (!material) return apiError("Material not found", 404);

  const resolved = await resolveRoleMaterialBytes(audition.role.id, material);
  if (!resolved) {
    return apiError("Material file is not available", 404);
  }

  return new NextResponse(new Uint8Array(resolved.buffer), {
    headers: {
      "Content-Type": resolved.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
