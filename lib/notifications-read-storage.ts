const STORAGE_KEY = "forecast-notifications-read";

export function readStoredReadState(): Record<string, boolean> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return null;
  }
}

export function writeStoredReadState(state: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function buildInitialReadState(
  notifications: Array<{ id: string; read: boolean }>,
): Record<string, boolean> {
  const stored = readStoredReadState();
  const state: Record<string, boolean> = {};
  for (const { id, read } of notifications) {
    state[id] = stored?.[id] ?? read;
  }
  return state;
}

export function buildServerReadState(
  notifications: Array<{ id: string; read: boolean }>,
): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const { id, read } of notifications) {
    state[id] = read;
  }
  return state;
}
