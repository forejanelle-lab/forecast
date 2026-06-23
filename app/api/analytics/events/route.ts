import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireAuthSession } from "@/lib/api/guards";
import {
  isBusinessAnalyticsEventType,
  SERVER_AUTHORITATIVE_EVENTS,
} from "@/lib/analytics/events";
import { recordBusinessEvent } from "@/lib/analytics/record";
import { sanitizeAnalyticsMetadata } from "@/lib/analytics/sanitize";
import { NextResponse } from "next/server";

const bodySchema = z.object({
  eventType: z.string().min(1),
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

export async function POST(request: Request) {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { eventType, metadata } = parsed.data;
  if (!isBusinessAnalyticsEventType(eventType)) {
    return apiError("Unsupported analytics event", 400);
  }

  if (SERVER_AUTHORITATIVE_EVENTS.has(eventType)) {
    return apiError("This event is recorded server-side", 403);
  }

  await recordBusinessEvent({
    eventType,
    userId: sessionOrError.user.id,
    userRole: sessionOrError.user.role,
    metadata: sanitizeAnalyticsMetadata(metadata),
  });

  return apiSuccess({ recorded: true });
}
