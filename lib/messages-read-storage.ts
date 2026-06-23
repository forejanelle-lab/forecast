const STORAGE_KEY = "forecast-messages-unread";

export function readStoredUnreadState(): Record<string, boolean> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return null;
  }
}

export function writeStoredUnreadState(state: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function markConversationUnread(conversationId: string) {
  const stored = readStoredUnreadState() ?? {};
  writeStoredUnreadState({ ...stored, [conversationId]: true });
}

export function buildInitialUnreadState(
  messageIds: Array<{ id: string; unread: boolean }>,
): Record<string, boolean> {
  const stored = readStoredUnreadState();
  const state: Record<string, boolean> = {};
  for (const { id, unread } of messageIds) {
    state[id] = stored?.[id] ?? unread;
  }
  if (stored) {
    for (const [id, unread] of Object.entries(stored)) {
      if (!(id in state)) state[id] = unread;
    }
  }
  return state;
}

export function buildServerUnreadState(
  messageIds: Array<{ id: string; unread: boolean }>,
): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const { id, unread } of messageIds) {
    state[id] = unread;
  }
  return state;
}
