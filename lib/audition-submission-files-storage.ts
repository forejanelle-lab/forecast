const DB_NAME = "forecast-audition-files";
const STORE_NAME = "files";

function fileKey(auditionId: string, fileName: string) {
  return `${auditionId}::${fileName}`;
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

export async function saveSubmissionFiles(
  auditionId: string,
  files: Array<{ fileName: string; file: File }>,
): Promise<void> {
  if (!files.length) return;
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  for (const { fileName, file } of files) {
    store.put(file, fileKey(auditionId, fileName));
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getSubmissionFile(
  auditionId: string,
  fileName: string,
): Promise<Blob | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.get(fileKey(auditionId, fileName));
  const result = await new Promise<Blob | File | null>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as Blob | File | null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export function createPlaceholderBlob(label: string, fileName: string): Blob {
  const content = [
    "Fore Cast — audition submission (demo)",
    "",
    `Label: ${label}`,
    `File: ${fileName}`,
    "",
    "This is a placeholder file for demo submissions.",
    "Files you upload and submit from this device can be downloaded in full.",
  ].join("\n");
  return new Blob([content], { type: "text/plain" });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
