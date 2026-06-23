const STORAGE_KEY = "forecast-profile-reviews";

export interface ProfileReviewEvent {
  actorId: string;
  timestamp: string;
  projectId?: string;
  roleId?: string;
  submissionId?: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function readEvents(): ProfileReviewEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProfileReviewEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(events: ProfileReviewEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  listeners.forEach((listener) => listener());
}

export function subscribeProfileReviews(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function recordProfileReview(
  actorId: string,
  context?: Pick<ProfileReviewEvent, "projectId" | "roleId" | "submissionId">,
) {
  const events = readEvents();
  events.push({
    actorId,
    timestamp: new Date().toISOString(),
    ...context,
  });
  writeEvents(events);
}

export function getProfileReviewCount(actorId: string): number {
  return readEvents().filter((event) => event.actorId === actorId).length;
}

export function getAllProfileReviewEvents(): ProfileReviewEvent[] {
  return readEvents();
}
