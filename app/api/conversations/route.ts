import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireAuthSession, requireCastingSession } from "@/lib/api/guards";
import {
  canCastingSendMessage,
  getCastingSendDisabledReason,
} from "@/lib/message-rules";
import {
  findOrCreateConversation,
  getConversationAsMessage,
  getConversationsForUser,
  sendConversationMessage,
} from "@/lib/data/conversations";
import { mapProjectStatus } from "@/lib/prisma-mappers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const createSchema = z.object({
  projectId: z.string().min(1),
  actorId: z.string().min(1),
  body: z.string().min(1),
});

export async function GET() {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const conversations = await getConversationsForUser(
    sessionOrError.user.id,
    sessionOrError.user.role,
  );

  return apiSuccess({ conversations });
}

export async function POST(request: Request) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: parsed.data.projectId,
      createdById: sessionOrError.user.id,
    },
    select: {
      id: true,
      title: true,
      status: true,
      productionCompany: true,
      submissionDeadline: true,
    },
  });

  if (!project) return apiError("Project not found", 404);

  const actorExists = await prisma.user.findFirst({
    where: { id: parsed.data.actorId, role: "ACTOR" },
    select: { id: true },
  });
  if (!actorExists) return apiError("Actor not found", 404);

  const previewMessage: Parameters<typeof canCastingSendMessage>[0] = {
    id: "",
    sender: "",
    preview: "",
    timestamp: "",
    unread: false,
    avatar: "",
    projectId: project.id,
    projectTitle: project.title,
    productionCompany: project.productionCompany,
    projectStatus: mapProjectStatus(project.status),
    submissionDeadline: project.submissionDeadline
      ? project.submissionDeadline.toISOString().slice(0, 10)
      : "",
    castingDirectorReachedOut: true,
    thread: [],
  };

  if (!canCastingSendMessage(previewMessage)) {
    return apiError(
      getCastingSendDisabledReason(previewMessage) ?? "Messaging is closed for this project.",
      403,
    );
  }

  const conversation = await findOrCreateConversation(
    parsed.data.projectId,
    parsed.data.actorId,
    sessionOrError.user.id,
  );

  await sendConversationMessage(
    conversation.id,
    sessionOrError.user.id,
    parsed.data.body,
  );

  const mapped = await getConversationAsMessage(
    conversation.id,
    sessionOrError.user.id,
    "CASTING",
  );

  return apiSuccess({ conversation: mapped }, 201);
}
