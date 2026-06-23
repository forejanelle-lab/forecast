import type { BusinessAnalyticsEventType } from "@prisma/client";

export type ClientAnalyticsMetadata = Record<string, string | number | boolean>;

export async function trackBusinessEvent(
  eventType: BusinessAnalyticsEventType,
  metadata?: ClientAnalyticsMetadata,
): Promise<void> {
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, metadata }),
      keepalive: true,
    });
  } catch (error) {
    console.error("[analytics] client track failed:", eventType, error);
  }
}
