const STORAGE_KEY = "forecast-actor-profile-photo";
const NAME_STORAGE_KEY = "forecast-actor-display-name";

export interface StoredProfilePhoto {
  dataUrl: string;
  fileName: string;
}

export function readStoredProfilePhoto(): StoredProfilePhoto | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredProfilePhoto;
    if (!parsed.dataUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredProfilePhoto(dataUrl: string, fileName: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ dataUrl, fileName } satisfies StoredProfilePhoto),
  );
}

export function readStoredDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(NAME_STORAGE_KEY);
}

export function writeStoredDisplayName(name: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(NAME_STORAGE_KEY, name);
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
