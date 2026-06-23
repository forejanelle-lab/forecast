import type { ApplicationStatus } from "@/types";

const STORAGE_KEY = "forecast-casting-audition-reviews";

export function readStoredCastingAuditionReviews(): Record<string, ApplicationStatus> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, ApplicationStatus>;
  } catch {
    return null;
  }
}

export function writeStoredCastingAuditionReviews(
  state: Record<string, ApplicationStatus>,
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function buildInitialCastingAuditionReviews(): Record<string, ApplicationStatus> {
  return readStoredCastingAuditionReviews() ?? {};
}
