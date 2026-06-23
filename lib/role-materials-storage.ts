import type { RoleAuditionFile, RoleAuditionPackage } from "@/types";
import { defaultRoleAuditionPackage } from "@/lib/default-role-audition-package";

const META_KEY_PREFIX = "forecast-role-materials-meta";
const DB_NAME = "forecast-role-materials";
const STORE_NAME = "files";

function metaKey(roleId: string) {
  return `${META_KEY_PREFIX}-${roleId}`;
}

function fileKey(roleId: string, fileName: string) {
  return `${roleId}::${fileName}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getRoleAuditionPackage(roleId?: string): RoleAuditionPackage {
  if (!roleId || typeof window === "undefined") {
    return defaultRoleAuditionPackage;
  }

  try {
    const raw = localStorage.getItem(metaKey(roleId));
    if (!raw) return defaultRoleAuditionPackage;

    const meta = JSON.parse(raw) as {
      files?: RoleAuditionFile[];
      instructions?: string;
    };

    return {
      ...defaultRoleAuditionPackage,
      instructions: meta.instructions ?? defaultRoleAuditionPackage.instructions,
      files: meta.files ?? [],
    };
  } catch {
    return defaultRoleAuditionPackage;
  }
}

export async function saveRoleMaterials(
  roleId: string,
  scripts: File[],
  photos: File[],
  instructions?: string,
): Promise<void> {
  const files: RoleAuditionFile[] = [
    ...scripts.map((file) => ({
      label: "Script",
      fileName: file.name,
      type: "document" as const,
    })),
    ...photos.map((file) => ({
      label: "Reference photo",
      fileName: file.name,
      type: "image" as const,
    })),
  ];

  await persistRoleMaterials(roleId, files, instructions);
  await storeNewRoleMaterialFiles(roleId, scripts, photos);
}

export async function updateRoleMaterials(
  roleId: string,
  options: {
    keepFiles: RoleAuditionFile[];
    newScripts: File[];
    newPhotos: File[];
    instructions?: string;
  },
): Promise<void> {
  const newFiles: RoleAuditionFile[] = [
    ...options.newScripts.map((file) => ({
      label: "Script",
      fileName: file.name,
      type: "document" as const,
    })),
    ...options.newPhotos.map((file) => ({
      label: "Reference photo",
      fileName: file.name,
      type: "image" as const,
    })),
  ];

  await persistRoleMaterials(roleId, [...options.keepFiles, ...newFiles], options.instructions);
  await storeNewRoleMaterialFiles(roleId, options.newScripts, options.newPhotos);
}

async function persistRoleMaterials(
  roleId: string,
  files: RoleAuditionFile[],
  instructions?: string,
): Promise<void> {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    metaKey(roleId),
    JSON.stringify({
      files,
      instructions: instructions?.trim() || undefined,
    }),
  );

  const fileNames = new Set(files.map((file) => file.fileName));
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const allKeys = await new Promise<string[]>((resolve, reject) => {
    const request = store.getAllKeys();
    request.onsuccess = () => resolve(request.result as string[]);
    request.onerror = () => reject(request.error);
  });

  for (const key of allKeys) {
    if (key.startsWith(`${roleId}::`) && !fileNames.has(key.slice(roleId.length + 2))) {
      store.delete(key);
    }
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function storeNewRoleMaterialFiles(
  roleId: string,
  scripts: File[],
  photos: File[],
): Promise<void> {
  const allFiles = [...scripts, ...photos];
  if (!allFiles.length || typeof window === "undefined") return;

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  for (const file of allFiles) {
    store.put(file, fileKey(roleId, file.name));
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getRoleMaterialFile(
  roleId: string,
  fileName: string,
): Promise<Blob | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.get(fileKey(roleId, fileName));
  const result = await new Promise<Blob | File | null>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as Blob | File | null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export function saveRoleAuditionInstructions(roleId: string, instructions: string) {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(metaKey(roleId));
    const meta = raw
      ? (JSON.parse(raw) as { files?: RoleAuditionFile[]; instructions?: string })
      : { files: [] };

    localStorage.setItem(
      metaKey(roleId),
      JSON.stringify({
        ...meta,
        instructions: instructions.trim() || undefined,
      }),
    );
  } catch {
    // ignore local storage errors
  }
}
