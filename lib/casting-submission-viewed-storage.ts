const STORAGE_KEY = "forecast-casting-submission-viewed";

export function readStoredViewedSubmissionIds(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredViewedSubmissionIds(ids: string[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function buildInitialViewedSubmissionIds(): Set<string> {
  const stored = readStoredViewedSubmissionIds();
  return new Set(stored ?? []);
}

export function markSubmissionViewed(auditionId: string) {
  const viewed = buildInitialViewedSubmissionIds();
  if (viewed.has(auditionId)) return;
  viewed.add(auditionId);
  writeStoredViewedSubmissionIds(Array.from(viewed));
}
