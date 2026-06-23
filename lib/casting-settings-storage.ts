import { fileToDataUrl } from "@/lib/actor-profile-storage";

const STORAGE_KEY = "forecast-casting-settings";

export interface CastingSettingsData {
  castingOfficeName: string;
  address: string;
  phoneNumber: string;
  profilePhotoUrl: string | null;
  profilePhotoFileName: string | null;
}

export const defaultCastingSettings: CastingSettingsData = {
  castingOfficeName: "",
  address: "",
  phoneNumber: "",
  profilePhotoUrl: null,
  profilePhotoFileName: null,
};

export function readStoredCastingSettings(): CastingSettingsData {
  if (typeof window === "undefined") return { ...defaultCastingSettings };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultCastingSettings };
    const parsed = JSON.parse(raw) as Partial<CastingSettingsData>;
    return {
      castingOfficeName:
        parsed.castingOfficeName ?? defaultCastingSettings.castingOfficeName,
      address: parsed.address ?? defaultCastingSettings.address,
      phoneNumber: parsed.phoneNumber ?? defaultCastingSettings.phoneNumber,
      profilePhotoUrl: parsed.profilePhotoUrl ?? null,
      profilePhotoFileName: parsed.profilePhotoFileName ?? null,
    };
  } catch {
    return { ...defaultCastingSettings };
  }
}

export function writeStoredCastingSettings(settings: CastingSettingsData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function profilePhotoFromFile(file: File) {
  const dataUrl = await fileToDataUrl(file);
  return { dataUrl, fileName: file.name };
}
