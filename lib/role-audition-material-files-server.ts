import { prisma } from "@/lib/prisma";
import type { RoleAuditionFile } from "@/types";

export interface StoredRoleMaterialFile {
  fileName: string;
  label: string;
  type: string;
  mimeType: string | null;
  data: Buffer;
}

export async function syncRoleAuditionMaterialFiles(
  roleId: string,
  uploadedFiles: StoredRoleMaterialFile[],
  keepFileNames: string[],
): Promise<void> {
  const keepSet = new Set(keepFileNames);

  await prisma.roleAuditionMaterialFile.deleteMany({
    where: {
      roleId,
      fileName: { notIn: [...keepSet] },
    },
  });

  for (const file of uploadedFiles) {
    await prisma.roleAuditionMaterialFile.upsert({
      where: {
        roleId_fileName: { roleId, fileName: file.fileName },
      },
      create: {
        roleId,
        label: file.label,
        fileName: file.fileName,
        type: file.type,
        mimeType: file.mimeType,
        data: Uint8Array.from(file.data),
      },
      update: {
        label: file.label,
        type: file.type,
        mimeType: file.mimeType,
        data: Uint8Array.from(file.data),
      },
    });
  }
}

export async function replaceRoleAuditionMaterialFiles(
  roleId: string,
  files: StoredRoleMaterialFile[],
): Promise<void> {
  await syncRoleAuditionMaterialFiles(
    roleId,
    files,
    files.map((file) => file.fileName),
  );
}

export async function persistRoleAuditionMaterialBytesFromFiles(
  roleId: string,
  files: RoleAuditionFile[],
): Promise<void> {
  const storedFiles: StoredRoleMaterialFile[] = [];

  for (const file of files) {
    if (!file.fileUrl?.startsWith("data:")) continue;
    const decoded = dataUrlToBuffer(file.fileUrl);
    if (!decoded) continue;

    storedFiles.push({
      fileName: file.fileName,
      label: file.label,
      type: file.type,
      mimeType: decoded.mimeType,
      data: decoded.buffer,
    });
  }

  await syncRoleAuditionMaterialFiles(
    roleId,
    storedFiles,
    files.map((file) => file.fileName),
  );
}

export async function getRoleAuditionMaterialFile(
  roleId: string,
  fileName: string,
): Promise<StoredRoleMaterialFile | null> {
  const row = await prisma.roleAuditionMaterialFile.findUnique({
    where: {
      roleId_fileName: { roleId, fileName },
    },
  });

  if (!row) return null;

  return {
    fileName: row.fileName,
    label: row.label,
    type: row.type,
    mimeType: row.mimeType,
    data: Buffer.from(row.data),
  };
}

export async function listRoleAuditionMaterialFileNames(roleId: string): Promise<string[]> {
  const rows = await prisma.roleAuditionMaterialFile.findMany({
    where: { roleId },
    select: { fileName: true },
  });
  return rows.map((row) => row.fileName);
}

export function dataUrlToBuffer(dataUrl: string): {
  buffer: Buffer;
  mimeType: string;
} | null {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/);
  if (!match) return null;

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = match[2] === ";base64";
  const payload = match[3];

  try {
    const buffer = isBase64
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8");
    return { buffer, mimeType };
  } catch {
    return null;
  }
}

export async function resolveRoleMaterialBytes(
  roleId: string,
  file: RoleAuditionFile,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const stored = await getRoleAuditionMaterialFile(roleId, file.fileName);
  if (stored) {
    return {
      buffer: stored.data,
      mimeType: stored.mimeType ?? inferMimeType(file.fileName, file.type),
    };
  }

  if (file.fileUrl?.startsWith("data:")) {
    const decoded = dataUrlToBuffer(file.fileUrl);
    if (decoded) return decoded;
  }

  return null;
}

function inferMimeType(fileName: string, type: RoleAuditionFile["type"]): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (type === "image") return "image/jpeg";
  if (type === "video") return "video/mp4";
  if (type === "audio") return "audio/mpeg";
  return "application/octet-stream";
}
