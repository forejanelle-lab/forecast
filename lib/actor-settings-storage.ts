import { fileToDataUrl } from "@/lib/actor-profile-storage";
import type { ActorHeadshot, ActorMediaItem } from "@/types";

const STORAGE_KEY = "forecast-actor-settings";

export interface StoredActorHeadshot {
  id: string;
  label: string;
  previewUrl: string;
  fileName: string;
  featured?: boolean;
}

export interface StoredActorMedia {
  id: string;
  label: string;
  type: ActorMediaItem["type"];
  previewUrl?: string;
  fileName: string;
  category: "material" | "video";
}

export interface ActorSettingsData {
  bio: string;
  locations: string[];
  playingAgeMin: string;
  playingAgeMax: string;
  height: string;
  gender: string;
  unionStatus: string;
  skills: string[];
  languages: string[];
  profilePhotoUrl: string | null;
  profilePhotoFileName: string | null;
  headshots: StoredActorHeadshot[];
  materials: StoredActorMedia[];
  videos: StoredActorMedia[];
}

export const defaultActorSettings: ActorSettingsData = {
  bio: "",
  locations: [],
  playingAgeMin: "",
  playingAgeMax: "",
  height: "",
  gender: "",
  unionStatus: "",
  skills: [],
  languages: [],
  profilePhotoUrl: null,
  profilePhotoFileName: null,
  headshots: [],
  materials: [],
  videos: [],
};

export function formatPlayingAge(min: string, max: string): string {
  const minTrim = min.trim();
  const maxTrim = max.trim();
  if (minTrim && maxTrim) return `${minTrim}-${maxTrim}`;
  return minTrim || maxTrim;
}

export function parsePlayingAge(playingAge: string): { min: string; max: string } {
  const parts = playingAge.split("-").map((s) => s.trim());
  return { min: parts[0] ?? "", max: parts[1] ?? "" };
}

export function readStoredActorSettings(): ActorSettingsData {
  if (typeof window === "undefined") return { ...defaultActorSettings };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultActorSettings };
    const parsed = JSON.parse(raw) as Partial<ActorSettingsData>;
    return {
      bio: parsed.bio ?? defaultActorSettings.bio,
      locations: parsed.locations ?? defaultActorSettings.locations,
      playingAgeMin: parsed.playingAgeMin ?? defaultActorSettings.playingAgeMin,
      playingAgeMax: parsed.playingAgeMax ?? defaultActorSettings.playingAgeMax,
      height: parsed.height ?? defaultActorSettings.height,
      gender: parsed.gender ?? defaultActorSettings.gender,
      unionStatus: parsed.unionStatus ?? defaultActorSettings.unionStatus,
      skills: parsed.skills ?? defaultActorSettings.skills,
      languages: parsed.languages ?? defaultActorSettings.languages,
      profilePhotoUrl: parsed.profilePhotoUrl ?? null,
      profilePhotoFileName: parsed.profilePhotoFileName ?? null,
      headshots: parsed.headshots ?? defaultActorSettings.headshots,
      materials: parsed.materials ?? defaultActorSettings.materials,
      videos: parsed.videos ?? defaultActorSettings.videos,
    };
  } catch {
    return { ...defaultActorSettings };
  }
}

function slimActorSettingsForStorage(settings: ActorSettingsData): ActorSettingsData {
  const keepUrl = (url?: string | null) =>
    url && url.length < 500_000 ? url : undefined;

  return {
    ...settings,
    profilePhotoUrl: keepUrl(settings.profilePhotoUrl) ?? null,
    profilePhotoFileName: settings.profilePhotoFileName,
    headshots: settings.headshots.map((h) => ({
      ...h,
      previewUrl: keepUrl(h.previewUrl) ?? "",
    })),
    materials: settings.materials.map((m) => ({
      ...m,
      previewUrl: keepUrl(m.previewUrl),
    })),
    videos: settings.videos.map((v) => ({
      ...v,
      previewUrl: keepUrl(v.previewUrl),
    })),
  };
}

export function writeStoredActorSettings(settings: ActorSettingsData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    const slim = slimActorSettingsForStorage(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...slim,
          profilePhotoUrl: null,
          profilePhotoFileName: null,
          headshots: slim.headshots.map((h) => ({ ...h, previewUrl: "" })),
          materials: slim.materials.map((m) => ({ ...m, previewUrl: undefined })),
          videos: slim.videos.map((v) => ({ ...v, previewUrl: undefined })),
        }),
      );
    }
  }
}

export function hasStoredActorSettings(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export async function profilePhotoFromFile(file: File) {
  const dataUrl = await fileToDataUrl(file);
  return { dataUrl, fileName: file.name };
}

export function storedHeadshotsToActorHeadshots(
  headshots: StoredActorHeadshot[],
  initials: string,
): ActorHeadshot[] {
  return headshots.map((h) => ({
    id: h.id,
    label: h.label,
    initials,
    featured: h.featured,
    previewUrl: h.previewUrl || undefined,
    fileName: h.fileName || undefined,
  }));
}

export function storedMediaToActorMedia(
  materials: StoredActorMedia[],
  videos: StoredActorMedia[],
): ActorMediaItem[] {
  return [...materials, ...videos].map((m) => ({
    id: m.id,
    label: m.label,
    type: m.type,
    previewUrl: m.previewUrl,
    fileName: m.fileName || undefined,
  }));
}

export function actorHeadshotsToStored(
  headshots: ActorHeadshot[],
): StoredActorHeadshot[] {
  return headshots.map((h) => ({
    id: h.id,
    label: h.label,
    previewUrl: h.previewUrl ?? "",
    fileName: h.fileName ?? "",
    featured: h.featured,
  }));
}

export function actorMediaToStored(media: ActorMediaItem[]): {
  materials: StoredActorMedia[];
  videos: StoredActorMedia[];
} {
  const materials: StoredActorMedia[] = [];
  const videos: StoredActorMedia[] = [];

  for (const item of media) {
    const stored: StoredActorMedia = {
      id: item.id,
      label: item.label,
      type: item.type,
      previewUrl: item.previewUrl,
      fileName: item.fileName ?? "",
      category:
        item.type === "video" && !item.label.toLowerCase().includes("demo")
          ? "video"
          : "material",
    };
    if (stored.category === "video") {
      videos.push(stored);
    } else {
      materials.push(stored);
    }
  }

  return { materials, videos };
}

export function buildProfileStateFromSettings(
  displayName: string,
  initials: string,
  settings: ActorSettingsData,
) {
  const playingAge = formatPlayingAge(settings.playingAgeMin, settings.playingAgeMax);
  const headshots = storedHeadshotsToActorHeadshots(settings.headshots, initials);
  const media = storedMediaToActorMedia(settings.materials, settings.videos);

  return {
    location: settings.locations.join(", "),
    playingAge,
    height: settings.height,
    bio: settings.bio,
    skills: settings.skills,
    languages: settings.languages,
    headshots,
    media,
    profilePhotoUrl: settings.profilePhotoUrl,
    profilePhotoFileName: settings.profilePhotoFileName,
    name: displayName,
  };
}
