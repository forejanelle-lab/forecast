import type { RoleAuditionFile } from "@/types";

const AUDITION_FILE_TYPES = new Set<RoleAuditionFile["type"]>([
  "video",
  "audio",
  "image",
  "document",
]);

export function parseRoleAuditionFiles(value: unknown): RoleAuditionFile[] {
  if (!Array.isArray(value)) return [];

  const files: RoleAuditionFile[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label : "";
    const fileName = typeof record.fileName === "string" ? record.fileName : "";
    const type = record.type;
    const fileUrl = typeof record.fileUrl === "string" ? record.fileUrl : undefined;

    if (!label || !fileName || !AUDITION_FILE_TYPES.has(type as RoleAuditionFile["type"])) {
      continue;
    }

    files.push({
      label,
      fileName,
      type: type as RoleAuditionFile["type"],
      fileUrl,
    });
  }

  return files;
}

export function mergeRoleAuditionFiles(
  incoming: RoleAuditionFile[],
  existing: RoleAuditionFile[],
): RoleAuditionFile[] {
  const existingByName = new Map(existing.map((file) => [file.fileName, file]));

  return incoming.map((file) => {
    if (file.fileUrl) return file;
    const previous = existingByName.get(file.fileName);
    if (previous?.fileUrl) {
      return { ...file, fileUrl: previous.fileUrl };
    }
    return file;
  });
}

export function sanitizeRoleAuditionFilesForDb(
  files: RoleAuditionFile[],
): Array<{
  label: string;
  fileName: string;
  type: RoleAuditionFile["type"];
  fileUrl?: string;
}> {
  return files.map(({ label, fileName, type, fileUrl }) => ({
    label,
    fileName,
    type,
    ...(fileUrl ? { fileUrl } : {}),
  }));
}

export function mergeAuditionFilesWithLocalUrls(
  dbFiles: RoleAuditionFile[],
  localFiles: RoleAuditionFile[],
): RoleAuditionFile[] {
  const localByName = new Map(localFiles.map((file) => [file.fileName, file]));

  return dbFiles.map((file) => {
    const local = localByName.get(file.fileName);
    if (local?.fileUrl) {
      return { ...file, fileUrl: local.fileUrl };
    }
    return file;
  });
}
