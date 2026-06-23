import type { AuditionSubmission } from "@/types";

const STORAGE_KEY = "forecast-audition-submissions";

export function readStoredSubmissions(): Record<string, AuditionSubmission> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, AuditionSubmission>;
  } catch {
    return null;
  }
}

export function writeStoredSubmissions(state: Record<string, AuditionSubmission>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function buildInitialSubmissionsState(
  auditions: Array<{ id: string; submission?: AuditionSubmission }>,
): Record<string, AuditionSubmission> {
  const stored = readStoredSubmissions();
  const state: Record<string, AuditionSubmission> = {};
  for (const audition of auditions) {
    const submission = stored?.[audition.id] ?? audition.submission;
    if (submission) {
      state[audition.id] = submission;
    }
  }
  return state;
}

export function buildServerSubmissionsState(
  auditions: Array<{ id: string; submission?: AuditionSubmission }>,
): Record<string, AuditionSubmission> {
  const state: Record<string, AuditionSubmission> = {};
  for (const audition of auditions) {
    if (audition.submission) {
      state[audition.id] = audition.submission;
    }
  }
  return state;
}
