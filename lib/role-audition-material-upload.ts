import { dataUrlToBlob } from "@/lib/data-url-blob";
import { getRoleMaterialFile } from "@/lib/role-materials-storage";
import type { RoleAuditionFile } from "@/types";
import type { MaterialFile } from "@/components/casting/role-material-upload-field";

export async function buildRoleMaterialUploadFormData(
  roleId: string,
  existingFiles: RoleAuditionFile[],
  scriptFiles: MaterialFile[],
  referencePhotoFiles: MaterialFile[],
): Promise<FormData | null> {
  const formData = new FormData();
  const metadata: Array<{
    fileName: string;
    label: string;
    type: RoleAuditionFile["type"];
  }> = [];

  const addMetadata = (
    fileName: string,
    label: string,
    type: RoleAuditionFile["type"],
  ) => {
    if (metadata.some((entry) => entry.fileName === fileName)) return;
    metadata.push({ fileName, label, type });
  };

  const appendBlob = (
    blob: Blob,
    fileName: string,
    label: string,
    type: RoleAuditionFile["type"],
  ) => {
    addMetadata(fileName, label, type);
    formData.append(`file:${fileName}`, blob, fileName);
  };

  for (const item of scriptFiles) {
    appendBlob(item.file, item.file.name, "Script", "document");
  }

  for (const item of referencePhotoFiles) {
    appendBlob(item.file, item.file.name, "Reference photo", "image");
  }

  for (const file of existingFiles) {
    addMetadata(file.fileName, file.label, file.type);

    if (formData.get(`file:${file.fileName}`) instanceof Blob) continue;

    const cachedBlob = await getRoleMaterialFile(roleId, file.fileName);
    if (cachedBlob) {
      formData.append(`file:${file.fileName}`, cachedBlob, file.fileName);
      continue;
    }

    if (file.fileUrl?.startsWith("data:")) {
      const dataBlob = dataUrlToBlob(file.fileUrl);
      if (dataBlob) {
        formData.append(`file:${file.fileName}`, dataBlob, file.fileName);
      }
    }
  }

  if (metadata.length === 0) return null;

  formData.append("metadata", JSON.stringify(metadata));
  return formData;
}

export async function uploadRoleAuditionMaterials(
  roleId: string,
  existingFiles: RoleAuditionFile[],
  scriptFiles: MaterialFile[],
  referencePhotoFiles: MaterialFile[],
): Promise<void> {
  const formData = await buildRoleMaterialUploadFormData(
    roleId,
    existingFiles,
    scriptFiles,
    referencePhotoFiles,
  );
  if (!formData) return;

  const response = await fetch(`/api/roles/${roleId}/audition-materials`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to upload audition materials.");
  }
}
