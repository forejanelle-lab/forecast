import { stripPersistableFileUrl } from "@/lib/role-audition-file-persist";
import { persistRoleAuditionMaterialBytesFromFiles } from "@/lib/role-audition-material-files-server";
import { prisma } from "@/lib/prisma";
import { sanitizeRoleAuditionFilesForDb } from "@/lib/role-audition-files";
import type { RoleAuditionFile } from "@/types";

export async function persistRoleAuditionFiles(
  roleId: string,
  files: RoleAuditionFile[],
): Promise<void> {
  const sanitized = sanitizeRoleAuditionFilesForDb(
    files.map((file) => ({
      ...file,
      fileUrl: stripPersistableFileUrl(file.fileUrl),
    })),
  );
  const json = JSON.stringify(sanitized);

  try {
    await prisma.role.update({
      where: { id: roleId },
      data: { auditionFiles: sanitized },
    });
    try {
      await persistRoleAuditionMaterialBytesFromFiles(roleId, files);
    } catch (bytesError) {
      console.error("Failed to persist role audition material bytes:", bytesError);
    }
    return;
  } catch (error) {
    console.warn("[role-materials] Prisma update failed, retrying with SQL:", error);
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "Role" SET "auditionFiles" = $1::jsonb, "updatedAt" = NOW() WHERE id = $2`,
    json,
    roleId,
  );

  try {
    await persistRoleAuditionMaterialBytesFromFiles(roleId, files);
  } catch (error) {
    console.error("Failed to persist role audition material bytes:", error);
  }
}
