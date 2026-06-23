import { NextResponse } from "next/server";
import { recordSiteAnalyticsEvent } from "@/lib/site-analytics";

interface VercelAnalyticsEvent {
  eventType?: string;
  path?: string;
  referrer?: string;
  country?: string;
  sessionId?: number | string;
  deviceId?: number | string;
}

function parseDrainBody(raw: string): VercelAnalyticsEvent[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as VercelAnalyticsEvent[];
    return Array.isArray(parsed) ? parsed : [];
  }

  return trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as VercelAnalyticsEvent);
}

export async function POST(request: Request) {
  const secret = process.env.VERCEL_ANALYTICS_DRAIN_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization");
    const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (bearer !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    const raw = await request.text();
    const events = parseDrainBody(raw);

    for (const event of events) {
      if (event.eventType !== "pageview" || !event.path) continue;

      const sessionId =
        event.sessionId != null ? String(event.sessionId) : "vercel-drain";
      const deviceId =
        event.deviceId != null ? String(event.deviceId) : undefined;

      await recordSiteAnalyticsEvent({
        path: event.path,
        referrer: event.referrer,
        country: event.country,
        sessionId,
        deviceId,
        source: "vercel-drain",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Vercel analytics drain error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
