import { apiError } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import { syncRoleAuditionMaterialFiles } from "@/lib/role-audition-material-files-server";
import { prisma } from "@/lib/prisma";
import type { RoleAuditionFile } from "@/types";
import { NextResponse } from "next/server";

const AUDITION_FILE_TYPES = new Set<RoleAuditionFile["type"]>([
  "video",
  "audio",
  "image",
  "document",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id: roleId } = await params;
  const role = await prisma.role.findFirst({
    where: {
      id: roleId,
      project: { createdById: sessionOrError.user.id },
    },
  });
  if (!role) return apiError("Role not found", 404);

  const formData = await request.formData();
  const metadataRaw = formData.get("metadata");
  if (typeof metadataRaw !== "string") {
    return apiError("Missing material metadata");
  }

  let metadata: Array<{
    fileName: string;
    label: string;
    type: RoleAuditionFile["type"];
  }>;
  try {
    metadata = JSON.parse(metadataRaw) as Array<{
      fileName: string;
      label: string;
      type: RoleAuditionFile["type"];
    }>;
  } catch {
    return apiError("Invalid material metadata");
  }

  const storedFiles = await Promise.all(
    metadata.map(async (meta) => {
      if (!meta?.fileName || !meta.label || !AUDITION_FILE_TYPES.has(meta.type)) {
        throw new Error("Invalid file metadata");
      }

      const entry = formData.get(`file:${meta.fileName}`);
      if (!(entry instanceof Blob) || entry.size === 0) {
        return null;
      }

      const buffer = Buffer.from(await entry.arrayBuffer());

      return {
        fileName: meta.fileName,
        label: meta.label,
        type: meta.type,
        mimeType: entry.type || null,
        data: buffer,
      };
    }),
  );

  const uploadedFiles = storedFiles.filter((file) => file !== null);

  try {
    await syncRoleAuditionMaterialFiles(
      roleId,
      uploadedFiles,
      metadata.map((meta) => meta.fileName),
    );
    return NextResponse.json({ ok: true, count: uploadedFiles.length });
  } catch (error) {
    console.error("Failed to store role audition materials:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to store audition materials",
      500,
    );
  }
}
