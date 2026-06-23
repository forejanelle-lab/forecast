import { fileToDataUrl } from "@/lib/actor-profile-storage";
import { getRoleMaterialFile } from "@/lib/role-materials-storage";
import type { RoleAuditionFile } from "@/types";

export const MAX_ROLE_AUDITION_FILE_URL_LENGTH = 500_000;

export function stripPersistableFileUrl(url?: string | null): string | undefined {
  if (!url || url.startsWith("blob:")) return undefined;
  if (url.length > MAX_ROLE_AUDITION_FILE_URL_LENGTH) return undefined;
  return url;
}

async function blobToDataUrl(blob: Blob, fileName: string): Promise<string | undefined> {
  try {
    const file =
      blob instanceof File
        ? blob
        : new File([blob], fileName, { type: blob.type || undefined });
    const dataUrl = await fileToDataUrl(file);
    return stripPersistableFileUrl(dataUrl);
  } catch {
    return undefined;
  }
}

export async function resolveRoleAuditionFileUrl(
  roleId: string,
  file: Pick<RoleAuditionFile, "fileName" | "fileUrl">,
): Promise<string | undefined> {
  const existing = stripPersistableFileUrl(file.fileUrl);
  if (existing) return existing;

  const blob = await getRoleMaterialFile(roleId, file.fileName);
  if (!blob) return undefined;
  return blobToDataUrl(blob, file.fileName);
}

export async function buildAuditionFilesForPersist(
  roleId: string,
  existingFiles: RoleAuditionFile[],
  newScripts: File[],
  newPhotos: File[],
): Promise<RoleAuditionFile[]> {
  const keptFiles = await Promise.all(
    existingFiles.map(async (file) => ({
      label: file.label,
      fileName: file.fileName,
      type: file.type,
      fileUrl: await resolveRoleAuditionFileUrl(roleId, file),
    })),
  );

  const scriptFiles = await Promise.all(
    newScripts.map(async (file) => ({
      label: "Script",
      fileName: file.name,
      type: "document" as const,
      fileUrl: stripPersistableFileUrl(await fileToDataUrl(file)),
    })),
  );

  const photoFiles = await Promise.all(
    newPhotos.map(async (file) => ({
      label: "Reference photo",
      fileName: file.name,
      type: "image" as const,
      fileUrl: stripPersistableFileUrl(await fileToDataUrl(file)),
    })),
  );

  return [...keptFiles, ...scriptFiles, ...photoFiles];
}
