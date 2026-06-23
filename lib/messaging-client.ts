import type { Message } from "@/types";

export async function fetchConversations(): Promise<Message[]> {
  const response = await fetch("/api/conversations");
  const data = (await response.json()) as { conversations?: Message[] };
  if (!response.ok) return [];
  return data.conversations ?? [];
}

export async function sendConversationMessage(
  conversationId: string,
  body: string,
): Promise<{ ok: boolean; conversation?: Message; error?: string }> {
  try {
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = (await response.json()) as {
      conversation?: Message;
      error?: string;
    };
    if (!response.ok) {
      return { ok: false, error: data.error ?? "Failed to send message." };
    }
    return { ok: true, conversation: data.conversation };
  } catch {
    return { ok: false, error: "Failed to send message." };
  }
}

export async function startCastingConversation({
  projectId,
  actorId,
  body,
}: {
  projectId: string;
  actorId: string;
  body: string;
}): Promise<{ ok: boolean; conversation?: Message; error?: string }> {
  try {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, actorId, body }),
    });
    const data = (await response.json()) as {
      conversation?: Message;
      error?: string;
    };
    if (!response.ok) {
      return { ok: false, error: data.error ?? "Failed to send message." };
    }
    return { ok: true, conversation: data.conversation };
  } catch {
    return { ok: false, error: "Failed to send message." };
  }
}

export async function markConversationReadApi(conversationId: string): Promise<void> {
  try {
    await fetch(`/api/conversations/${conversationId}/messages`);
  } catch {
    // ignore read sync failures
  }
}

export async function deleteConversationApi(
  conversationId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      return { ok: false, error: data.error ?? "Failed to delete conversation." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete conversation." };
  }
}
