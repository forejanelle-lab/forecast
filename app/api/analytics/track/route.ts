import { NextResponse } from "next/server";
import { z } from "zod";
import { recordSiteAnalyticsEvent } from "@/lib/site-analytics";

const trackSchema = z.object({
  path: z.string().min(1).max(500),
  referrer: z.string().max(500).optional().nullable(),
  sessionId: z.string().min(8).max(120),
  deviceId: z.string().max(120).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const country =
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      null;

    await recordSiteAnalyticsEvent({
      path: parsed.data.path,
      referrer: parsed.data.referrer,
      country,
      sessionId: parsed.data.sessionId,
      deviceId: parsed.data.deviceId,
      source: "app",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
