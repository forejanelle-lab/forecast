import { formatTimestamp, getInitials, mapProjectStatus, resolveProfilePhotoUrl } from "@/lib/prisma-mappers";
import {
  canActorSendMessage,
  canCastingSendMessage,
} from "@/lib/message-rules";
import { syncAllProjectLifecycleStatuses } from "@/lib/project-lifecycle";
import { prisma } from "@/lib/prisma";
import type { ConversationMessage, Message } from "@/types";

type ConversationWithRelations = {
  id: string;
  createdAt: Date;
  actorUserId: string;
  castingUserId: string;
  project: {
    id: string;
    title: string;
    status: string;
    productionCompany: string;
    submissionDeadline: Date | null;
    createdBy: { name: string | null };
  };
  actorUser: { id: string; name: string | null; actorProfile?: {
    profilePhotoUrl: string | null;
    headshots: { url: string | null; featured: boolean }[];
  } | null };
  castingUser: { id: string; name: string | null; castingProfile?: {
    profilePhotoUrl: string | null;
  } | null };
  messages: {
    id: string;
    body: string;
    createdAt: Date;
    read: boolean;
    senderId: string;
    sender: { id: string; role: string };
  }[];
};

function mapConversationToMessage(
  conversation: ConversationWithRelations,
  viewerUserId: string,
  viewerRole: "ACTOR" | "CASTING",
): Message {
  const lastMessage = conversation.messages.at(-1);
  const actorName = conversation.actorUser.name ?? "Actor";
  const castingName = conversation.castingUser.name ?? "Casting Director";
  const isActorViewer = viewerRole === "ACTOR";

  const thread: ConversationMessage[] = conversation.messages.map((msg) => ({
    id: msg.id,
    from: msg.sender.role === "CASTING" ? "casting" : "actor",
    body: msg.body,
    timestamp: formatTimestamp(msg.createdAt),
  }));

  const unread = conversation.messages.some(
    (msg) => !msg.read && msg.senderId !== viewerUserId,
  );

  return {
    id: conversation.id,
    sender: isActorViewer ? castingName : actorName,
    preview: lastMessage?.body ?? "",
    timestamp: lastMessage
      ? formatTimestamp(lastMessage.createdAt)
      : formatTimestamp(conversation.createdAt),
    unread,
    avatar: getInitials(isActorViewer ? castingName : actorName),
    projectId: conversation.project.id,
    projectTitle: conversation.project.title,
    productionCompany: conversation.project.productionCompany,
    projectStatus: mapProjectStatus(conversation.project.status),
    submissionDeadline: conversation.project.submissionDeadline
      ? conversation.project.submissionDeadline.toISOString().slice(0, 10)
      : "",
    castingDirectorReachedOut: conversation.messages.some(
      (m) => m.sender.role === "CASTING",
    ),
    actorId: conversation.actorUser.id,
    actorName,
    actorPhotoUrl: resolveProfilePhotoUrl(conversation.actorUser.actorProfile ?? null),
    castingDirectorName: castingName,
    castingDirectorPhotoUrl: conversation.castingUser.castingProfile?.profilePhotoUrl ?? undefined,
    thread,
  };
}

const conversationInclude = {
  project: {
    select: {
      id: true,
      title: true,
      status: true,
      productionCompany: true,
      submissionDeadline: true,
      createdBy: { select: { name: true } },
    },
  },
  actorUser: {
    select: {
      id: true,
      name: true,
      actorProfile: {
        select: {
          profilePhotoUrl: true,
          headshots: {
            orderBy: { sortOrder: "asc" as const },
            select: { url: true, featured: true },
          },
        },
      },
    },
  },
  castingUser: {
    select: {
      id: true,
      name: true,
      castingProfile: { select: { profilePhotoUrl: true } },
    },
  },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: { sender: { select: { id: true, role: true } } },
  },
};

export async function getConversationAsMessage(
  conversationId: string,
  viewerUserId: string,
  viewerRole: "ACTOR" | "CASTING",
): Promise<Message | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude,
  });
  if (!conversation) return null;
  return mapConversationToMessage(conversation, viewerUserId, viewerRole);
}

export async function assertCanSendMessage(
  conversationId: string,
  senderId: string,
  senderRole: "ACTOR" | "CASTING",
): Promise<Message> {
  const message = await getConversationAsMessage(conversationId, senderId, senderRole);
  if (!message) throw new Error("Conversation not found");

  const allowed =
    senderRole === "ACTOR"
      ? canActorSendMessage(message)
      : canCastingSendMessage(message);

  if (!allowed) throw new Error("Messaging is not available for this conversation");

  return message;
}

export async function getConversationsForUser(
  userId: string,
  role: "ACTOR" | "CASTING",
): Promise<Message[]> {
  await syncAllProjectLifecycleStatuses();

  const conversations = await prisma.conversation.findMany({
    where:
      role === "ACTOR"
        ? { actorUserId: userId }
        : { castingUserId: userId },
    orderBy: { lastMessageAt: "desc" },
    include: conversationInclude,
  });

  return conversations.map((conversation) =>
    mapConversationToMessage(conversation, userId, role),
  );
}

export async function sendConversationMessage(
  conversationId: string,
  senderId: string,
  body: string,
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) throw new Error("Conversation not found");

  const message = await prisma.conversationMessage.create({
    data: {
      conversationId,
      senderId,
      body: body.trim(),
    },
    include: { sender: { select: { id: true, role: true } } },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  const recipientId =
    senderId === conversation.actorUserId
      ? conversation.castingUserId
      : conversation.actorUserId;

  await prisma.notification.create({
    data: {
      userId: recipientId,
      category: "MESSAGES",
      title: "New message",
      message: body.trim().slice(0, 120),
    },
  });

  return message;
}

export async function findOrCreateConversation(
  projectId: string,
  actorUserId: string,
  castingUserId: string,
) {
  const existing = await prisma.conversation.findUnique({
    where: { projectId_actorUserId: { projectId, actorUserId } },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      projectId,
      actorUserId,
      castingUserId,
    },
  });
}

export async function deleteConversationForUser(
  conversationId: string,
  userId: string,
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, actorUserId: true, castingUserId: true },
  });

  if (!conversation) throw new Error("Conversation not found");

  const isParticipant =
    conversation.actorUserId === userId || conversation.castingUserId === userId;

  if (!isParticipant) throw new Error("Forbidden");

  await prisma.conversation.delete({ where: { id: conversationId } });
}

export async function markConversationRead(conversationId: string, userId: string) {
  await prisma.conversationMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      read: false,
    },
    data: { read: true },
  });
}
