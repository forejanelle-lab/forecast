"use client";

import type { Message } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface MessagesReadContextValue {
  isUnread: (id: string) => boolean;
  unreadCount: number;
  markAsRead: (id: string) => void;
  conversations: Message[];
  upsertConversation: (conversation: Message) => void;
  replaceConversations: (conversations: Message[]) => void;
  removeConversation: (id: string) => void;
}

const MessagesReadContext = createContext<MessagesReadContextValue | null>(null);

export function MessagesReadProvider({
  children,
  initialConversations = [],
}: {
  children: React.ReactNode;
  initialConversations?: Message[];
}) {
  const [conversations, setConversations] = useState<Message[]>(initialConversations);

  const upsertConversation = useCallback((conversation: Message) => {
    setConversations((prev) => {
      const exists = prev.some((item) => item.id === conversation.id);
      if (exists) {
        return prev.map((item) =>
          item.id === conversation.id ? conversation : item,
        );
      }
      return [conversation, ...prev];
    });
  }, []);

  const replaceConversations = useCallback((next: Message[]) => {
    setConversations(next);
  }, []);

  const removeConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((conversation) => conversation.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === id ? { ...conversation, unread: false } : conversation,
      ),
    );
  }, []);

  const isUnread = useCallback(
    (id: string) => conversations.find((c) => c.id === id)?.unread ?? false,
    [conversations],
  );

  const unreadCount = useMemo(
    () => conversations.filter((conversation) => conversation.unread).length,
    [conversations],
  );

  const value = useMemo(
    () => ({
      isUnread,
      unreadCount,
      markAsRead,
      conversations,
      upsertConversation,
      replaceConversations,
      removeConversation,
    }),
    [isUnread, unreadCount, markAsRead, conversations, upsertConversation, replaceConversations, removeConversation],
  );

  return (
    <MessagesReadContext.Provider value={value}>
      {children}
    </MessagesReadContext.Provider>
  );
}

export function useMessagesRead() {
  const context = useContext(MessagesReadContext);
  if (!context) {
    throw new Error("useMessagesRead must be used within MessagesReadProvider");
  }
  return context;
}

export function useMessagesReadOptional() {
  return useContext(MessagesReadContext);
}
