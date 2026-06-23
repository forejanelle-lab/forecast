"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DeleteConversationModal } from "@/components/messages/delete-conversation-modal";
import { useActorProfileOptional } from "@/components/providers/actor-profile-provider";
import { useCastingProfileOptional } from "@/components/providers/casting-profile-provider";
import { useMessagesRead } from "@/components/providers/messages-read-provider";
import {
  getConversationAvatar,
  getConversationDisplayName,
} from "@/lib/casting-messages-storage";
import {
  deleteConversationApi,
  fetchConversations,
  markConversationReadApi,
  sendConversationMessage,
} from "@/lib/messaging-client";
import {
  canActorSendMessage,
  canCastingSendMessage,
  getActorSendDisabledReason,
  getCastingSendDisabledReason,
} from "@/lib/message-rules";
import { cn, formatRelativeDate } from "@/lib/utils";
import { getInitials } from "@/lib/user";
import { Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function formatMessageTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

interface MessagesContentProps {
  role?: "actor" | "casting";
  actorUserId?: string;
}

export default function MessagesContent({
  role = "casting",
  actorUserId,
}: MessagesContentProps) {
  const searchParams = useSearchParams();
  const conversationFromUrl = searchParams.get("conversation");
  const [query, setQuery] = useState("");
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendErrors, setSendErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    conversations,
    isUnread,
    markAsRead,
    upsertConversation,
    replaceConversations,
    removeConversation,
  } = useMessagesRead();

  const isActorView = role === "actor";

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (isActorView && actorUserId) {
      list = list.filter(
        (conversation) =>
          !conversation.actorId || conversation.actorId === actorUserId,
      );
    }
    const normalized = query.trim().toLowerCase();
    if (!normalized) return list;
    return list.filter((msg) => {
      const displayName = getConversationDisplayName(msg, role);
      return (
        displayName.toLowerCase().includes(normalized) ||
        msg.projectTitle.toLowerCase().includes(normalized) ||
        msg.productionCompany.toLowerCase().includes(normalized) ||
        msg.preview.toLowerCase().includes(normalized) ||
        msg.thread.some((item) => item.body.toLowerCase().includes(normalized))
      );
    });
  }, [conversations, isActorView, actorUserId, query, role]);

  const selectedId = useMemo(() => {
    if (
      conversationFromUrl &&
      filteredConversations.some((msg) => msg.id === conversationFromUrl)
    ) {
      return conversationFromUrl;
    }
    if (
      userSelectedId &&
      filteredConversations.some((msg) => msg.id === userSelectedId)
    ) {
      return userSelectedId;
    }
    return filteredConversations[0]?.id ?? "";
  }, [conversationFromUrl, userSelectedId, filteredConversations]);

  const activeId = selectedId;
  const draft = drafts[activeId] ?? "";
  const sendError = sendErrors[activeId] ?? null;

  const setDraft = (value: string) => {
    if (!activeId) return;
    setDrafts((prev) => ({ ...prev, [activeId]: value }));
  };

  const activeMessage =
    filteredConversations.find((m) => m.id === activeId) ?? filteredConversations[0];

  const actorProfile = useActorProfileOptional();
  const castingProfile = useCastingProfileOptional();

  const actorDisplayName = activeMessage?.actorName ?? activeMessage?.sender ?? "Actor";
  const castingDisplayName =
    activeMessage?.castingDirectorName ?? activeMessage?.sender ?? "Casting Director";

  const selfActorInitials = actorProfile?.initials ?? getInitials(actorDisplayName);
  const selfActorPhotoUrl = actorProfile?.profilePhotoUrl ?? activeMessage?.actorPhotoUrl;

  const selfCastingInitials =
    castingProfile?.initials ?? getInitials(castingDisplayName);
  const selfCastingPhotoUrl =
    castingProfile?.settings.profilePhotoUrl ?? activeMessage?.castingDirectorPhotoUrl;

  const otherActorInitials = getInitials(actorDisplayName);
  const otherCastingInitials = getInitials(castingDisplayName);

  const canSend = activeMessage
    ? isActorView
      ? canActorSendMessage(activeMessage)
      : canCastingSendMessage(activeMessage)
    : false;

  const sendDisabledReason = activeMessage
    ? isActorView
      ? getActorSendDisabledReason(activeMessage)
      : getCastingSendDisabledReason(activeMessage)
    : null;

  useEffect(() => {
    fetchConversations().then((list) => {
      if (list.length > 0) replaceConversations(list);
    });
  }, [replaceConversations]);

  useEffect(() => {
    if (!activeId) return;
    markAsRead(activeId);
    markConversationReadApi(activeId);
  }, [activeId, markAsRead]);

  const handleSend = async () => {
    if (!activeMessage || !canSend || sending) return;
    const body = draft.trim();
    if (!body) return;

    setSending(true);
    if (activeId) {
      setSendErrors((prev) => {
        const next = { ...prev };
        delete next[activeId];
        return next;
      });
    }

    const result = await sendConversationMessage(activeMessage.id, body);
    if (!result.ok) {
      setSendErrors((prev) => ({
        ...prev,
        [activeMessage.id]: result.error ?? "Failed to send message.",
      }));
      setSending(false);
      return;
    }

    setDrafts((prev) => ({ ...prev, [activeMessage.id]: "" }));

    if (result.conversation) {
      upsertConversation(result.conversation);
    } else {
      const timestamp = new Date().toISOString();
      upsertConversation({
        ...activeMessage,
        preview: body,
        timestamp,
        unread: false,
        castingDirectorReachedOut:
          activeMessage.castingDirectorReachedOut || !isActorView,
        thread: [
          ...activeMessage.thread,
          {
            id: `${activeMessage.id}-${timestamp}`,
            from: isActorView ? "actor" : "casting",
            body,
            timestamp,
          },
        ],
      });
    }

    setDraft("");
    setSending(false);
  };

  const handleDeleteConversation = async () => {
    if (!activeMessage || deleting) return;
    setDeleting(true);
    setDeleteError(null);

    const result = await deleteConversationApi(activeMessage.id);
    if (!result.ok) {
      setDeleteError(result.error ?? "Failed to delete conversation.");
      setDeleting(false);
      return;
    }

    removeConversation(activeMessage.id);
    setDeleteOpen(false);
    setDeleting(false);
    setUserSelectedId(null);
  };

  if (!conversations.length) {
    return (
      <div className="animate-fade-in max-w-5xl">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary mb-3">
          Messages
        </h1>
        <p className="text-sm text-text-secondary">
          {isActorView
            ? "No messages yet. You'll be able to reply when a casting director reaches out about a project."
            : "No conversations yet."}
        </p>
      </div>
    );
  }

  if (!activeMessage) {
    return (
      <div className="animate-fade-in max-w-5xl h-[calc(100vh-6rem)] flex flex-col">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary mb-3">
          Messages
        </h1>
        <Card padding="sm" className="flex flex-1 min-h-0 overflow-hidden">
          <div className="w-56 sm:w-64 border-r border-border/60 flex flex-col shrink-0">
            <div className="p-2 border-b border-border/60">
              <Input
                icon
                placeholder="Search by name or project..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <p className="px-2.5 py-4 text-[11px] text-text-secondary text-center">
                No conversations match your search.
              </p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-4">
            <p className="text-sm text-text-secondary">
              No conversations match your search.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const headerName = getConversationDisplayName(activeMessage, role);
  const headerAvatar = getConversationAvatar(activeMessage, role);

  return (
    <div className="animate-fade-in max-w-5xl h-[calc(100vh-6rem)] flex flex-col">
      <h1 className="text-xl font-semibold tracking-tight text-text-primary mb-3">
        Messages
      </h1>

      <Card padding="sm" className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-56 sm:w-64 border-r border-border/60 flex flex-col shrink-0">
          <div className="p-2 border-b border-border/60">
            <Input
              icon
              placeholder="Search by name or project..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <p className="px-2.5 py-4 text-[11px] text-text-secondary text-center">
                No conversations match your search.
              </p>
            ) : (
              filteredConversations.map((msg) => {
                const listName = getConversationDisplayName(msg, role);
                const listAvatar = getConversationAvatar(msg, role);
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => setUserSelectedId(msg.id)}
                    className={cn(
                      "w-full flex items-start gap-2 px-2.5 py-2 text-left transition-colors hover:bg-bg-sidebar/50",
                      msg.id === activeMessage.id && "bg-bg-sidebar",
                    )}
                  >
                    <Avatar initials={listAvatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="font-medium text-xs text-text-primary truncate">
                          {listName}
                        </p>
                        <span className="text-[10px] text-text-secondary shrink-0">
                          {formatRelativeDate(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate leading-snug">
                        {msg.projectTitle}
                      </p>
                      <p className="text-[10px] text-text-secondary/80 truncate leading-snug">
                        {msg.preview}
                      </p>
                    </div>
                    {isUnread(msg.id) && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
            <Avatar initials={headerAvatar} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary truncate">
                {headerName}
              </p>
              <p className="text-[10px] text-text-secondary truncate">
                {activeMessage.projectTitle} · {activeMessage.productionCompany}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 shrink-0 text-text-secondary hover:text-danger"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
              aria-label="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {activeMessage.thread.map((item) =>
              item.from === "casting" ? (
                <div key={item.id} className="flex gap-2">
                  <Avatar
                    initials={
                      isActorView ? otherCastingInitials : selfCastingInitials
                    }
                    imageUrl={isActorView ? activeMessage.castingDirectorPhotoUrl : selfCastingPhotoUrl}
                    size="sm"
                  />
                  <div className="rounded-xl rounded-tl-sm bg-bg-sidebar px-3 py-2 max-w-[85%]">
                    <p className="text-xs text-text-primary leading-relaxed">
                      {item.body}
                    </p>
                    <p className="text-[10px] text-text-secondary mt-1">
                      {formatMessageTime(item.timestamp)}
                    </p>
                  </div>
                </div>
              ) : (
                <div key={item.id} className="flex gap-2 justify-end">
                  <div className="rounded-xl rounded-tr-sm bg-text-primary px-3 py-2 max-w-[85%]">
                    <p className="text-xs text-white leading-relaxed">{item.body}</p>
                    <p className="text-[10px] text-white/60 mt-1">
                      {formatMessageTime(item.timestamp)}
                    </p>
                  </div>
                  <Avatar
                    initials={isActorView ? selfActorInitials : otherActorInitials}
                    imageUrl={isActorView ? selfActorPhotoUrl : activeMessage.actorPhotoUrl}
                    size="sm"
                  />
                </div>
              ),
            )}
          </div>

          <div className="px-3 py-2 border-t border-border/60">
            {(sendDisabledReason || sendError) && (
              <p className="text-[10px] text-text-secondary mb-1.5 leading-snug">
                {sendError ?? sendDisabledReason}
              </p>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  canSend
                    ? "Type a message..."
                    : "Messaging unavailable for this project"
                }
                disabled={!canSend || sending}
                className={cn(
                  "flex-1 h-8 rounded-lg border border-border bg-bg-primary px-3 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30",
                  !canSend && "opacity-50 cursor-not-allowed bg-bg-sidebar/50",
                )}
              />
              <button
                type="button"
                disabled={!canSend || sending || !draft.trim()}
                onClick={handleSend}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors shrink-0",
                  canSend && draft.trim()
                    ? "bg-text-primary text-white hover:bg-text-primary/90"
                    : "bg-bg-sidebar text-text-secondary/50 cursor-not-allowed",
                )}
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {deleteOpen && activeMessage && (
        <DeleteConversationModal
          displayName={headerName}
          projectTitle={activeMessage.projectTitle}
          deleting={deleting}
          error={deleteError}
          onConfirm={handleDeleteConversation}
          onClose={() => {
            if (deleting) return;
            setDeleteOpen(false);
            setDeleteError(null);
          }}
        />
      )}
    </div>
  );
}
