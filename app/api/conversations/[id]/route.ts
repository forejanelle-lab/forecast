import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireAuthSession } from "@/lib/api/guards";
import { deleteConversationForUser } from "@/lib/data/conversations";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { id } = await params;

  try {
    await deleteConversationForUser(id, sessionOrError.user.id);
    return apiSuccess({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete conversation";
    if (message === "Conversation not found") {
      return apiError(message, 404);
    }
    if (message === "Forbidden") {
      return apiError(message, 403);
    }
    return apiError(message);
  }
}
