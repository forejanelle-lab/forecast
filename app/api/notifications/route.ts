import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireAuthSession } from "@/lib/api/guards";
import { getNotificationsForUser, mapNotificationRow } from "@/lib/data/projects";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const notifications = await getNotificationsForUser(sessionOrError.user.id);
  return apiSuccess({ notifications });
}

export async function PATCH(request: Request) {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const body = await request.json();

  if (body?.readAll) {
    await prisma.notification.updateMany({
      where: { userId: sessionOrError.user.id, read: false },
      data: { read: true },
    });
    const notifications = await getNotificationsForUser(sessionOrError.user.id);
    return apiSuccess({ notifications });
  }

  if (!body?.id) {
    return apiError("Notification id is required.");
  }

  const notification = await prisma.notification.updateMany({
    where: { id: body.id, userId: sessionOrError.user.id },
    data: { read: true },
  });

  if (notification.count === 0) {
    return apiError("Notification not found", 404);
  }

  const row = await prisma.notification.findUnique({ where: { id: body.id } });
  return apiSuccess({ notification: row ? mapNotificationRow(row) : null });
}
