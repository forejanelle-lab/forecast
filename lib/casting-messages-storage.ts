import { getInitials } from "@/lib/user";
import type { ConversationMessage, Message, ProjectStatus } from "@/types";

const STORAGE_KEY = "forecast-casting-messages";

export function castingConversationId(projectId: string, actorId: string) {
  return `cast-${projectId}-${actorId}`;
}

function readStoredCastingMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Message[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredCastingMessages(conversations: Message[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  cachedConversations = null;
  cachedConversationsRaw = null;
}

export function getStoredCastingMessages(): Message[] {
  return readStoredCastingMessages();
}

export function getAllConversations(): Message[] {
  return readStoredCastingMessages().sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );
}

let cachedConversations: Message[] | null = null;
let cachedConversationsRaw: string | null = null;

/** Cached variant for useSyncExternalStore snapshots. */
export function getCachedConversations(): Message[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === cachedConversationsRaw && cachedConversations) {
    return cachedConversations;
  }
  cachedConversationsRaw = raw;
  cachedConversations = getAllConversations();
  return cachedConversations;
}

export function sendCastingMessageToActor({
  projectId,
  actorId,
  actorName,
  actorInitials,
  body,
  projectTitle,
  productionCompany,
  projectStatus,
  submissionDeadline,
  castingDirectorName,
}: {
  projectId: string;
  actorId: string;
  actorName: string;
  actorInitials: string;
  body: string;
  projectTitle: string;
  productionCompany: string;
  projectStatus: ProjectStatus;
  submissionDeadline: string;
  castingDirectorName: string;
}): string {
  const trimmed = body.trim();
  if (!trimmed) return "";

  const conversationId = castingConversationId(projectId, actorId);
  const timestamp = new Date().toISOString();
  const threadMessage: ConversationMessage = {
    id: `${conversationId}-t-${Date.now()}`,
    from: "casting",
    body: trimmed,
    timestamp,
  };

  const stored = readStoredCastingMessages();
  const existingIndex = stored.findIndex((conversation) => conversation.id === conversationId);

  if (existingIndex >= 0) {
    const existing = stored[existingIndex];
    const updated: Message = {
      ...existing,
      preview: trimmed,
      timestamp,
      thread: [...existing.thread, threadMessage],
    };
    stored[existingIndex] = updated;
    writeStoredCastingMessages(stored);
    return conversationId;
  }

  const conversation: Message = {
    id: conversationId,
    sender: actorName,
    actorId,
    actorName,
    castingDirectorName,
    preview: trimmed,
    timestamp,
    unread: false,
    avatar: actorInitials,
    projectId,
    projectTitle,
    productionCompany,
    projectStatus,
    submissionDeadline,
    castingDirectorReachedOut: true,
    thread: [threadMessage],
  };

  writeStoredCastingMessages([...stored, conversation]);
  return conversationId;
}

export function getConversationDisplayName(
  conversation: Message,
  role: "actor" | "casting",
): string {
  if (role === "actor") {
    return conversation.castingDirectorName ?? conversation.sender;
  }
  return conversation.actorName ?? conversation.sender;
}

export function getConversationAvatar(
  conversation: Message,
  role: "actor" | "casting",
): string {
  if (role === "actor") {
    return getInitials(conversation.castingDirectorName ?? conversation.sender);
  }
  return conversation.avatar;
}
