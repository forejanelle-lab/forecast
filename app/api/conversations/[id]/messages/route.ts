import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireAuthSession } from "@/lib/api/guards";
import {
  assertCanSendMessage,
  getConversationAsMessage,
  markConversationRead,
  sendConversationMessage,
} from "@/lib/data/conversations";
import {
  getActorSendDisabledReason,
  getCastingSendDisabledReason,
} from "@/lib/message-rules";
import { recordBusinessEvent } from "@/lib/analytics/record";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const postSchema = z.object({
  body: z.string().min(1),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) return apiError("Conversation not found", 404);

  const isParticipant =
    conversation.actorUserId === sessionOrError.user.id ||
    conversation.castingUserId === sessionOrError.user.id;

  if (!isParticipant) return apiError("Forbidden", 403);

  await markConversationRead(id, sessionOrError.user.id);

  const messages = await prisma.conversationMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, role: true } } },
  });

  return apiSuccess({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) return apiError("Conversation not found", 404);

  const isParticipant =
    conversation.actorUserId === sessionOrError.user.id ||
    conversation.castingUserId === sessionOrError.user.id;

  if (!isParticipant) return apiError("Forbidden", 403);

  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    await assertCanSendMessage(
      id,
      sessionOrError.user.id,
      sessionOrError.user.role,
    );
  } catch {
    const preview = await getConversationAsMessage(
      id,
      sessionOrError.user.id,
      sessionOrError.user.role,
    );
    const reason = preview
      ? sessionOrError.user.role === "ACTOR"
        ? getActorSendDisabledReason(preview)
        : getCastingSendDisabledReason(preview)
      : "Conversation not found";
    return apiError(reason ?? "Messaging is not available.", 403);
  }

  await sendConversationMessage(
    id,
    sessionOrError.user.id,
    parsed.data.body,
  );

  void recordBusinessEvent({
    eventType: "MESSAGE_SENT",
    userId: sessionOrError.user.id,
    userRole: sessionOrError.user.role,
    metadata: { conversationId: id },
  });

  const updatedConversation = await getConversationAsMessage(
    id,
    sessionOrError.user.id,
    sessionOrError.user.role,
  );

  return apiSuccess({ conversation: updatedConversation }, 201);
}
