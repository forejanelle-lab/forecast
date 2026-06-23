import { prisma } from "@/lib/prisma";

export interface WebAnalyticsRankedRow {
  label: string;
  count: number;
  percentage: number;
}

export interface WebAnalyticsDailyRow {
  date: string;
  pageViews: number;
  visitors: number;
}

export interface WebAnalyticsSummary {
  rangeDays: number;
  pageViews: number;
  visitors: number;
  daily: WebAnalyticsDailyRow[];
  topPages: WebAnalyticsRankedRow[];
  topCountries: WebAnalyticsRankedRow[];
  topReferrers: WebAnalyticsRankedRow[];
}

function startDateForRange(days: number): Date {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

function formatReferrerLabel(referrer: string | null | undefined): string {
  if (!referrer?.trim()) return "Direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host || "Direct";
  } catch {
    return referrer.slice(0, 80);
  }
}

function toRankedRows(
  rows: { label: string; count: number }[],
  total: number,
): WebAnalyticsRankedRow[] {
  return rows.map((row) => ({
    label: row.label,
    count: row.count,
    percentage: total > 0 ? Math.round((row.count / total) * 100) : 0,
  }));
}

export async function getWebAnalyticsSummary(
  rangeDays: number,
): Promise<WebAnalyticsSummary> {
  const days = Math.min(Math.max(rangeDays, 1), 90);
  const since = startDateForRange(days);

  const events = await prisma.siteAnalyticsEvent.findMany({
    where: {
      createdAt: { gte: since },
      eventType: "pageview",
    },
    select: {
      path: true,
      referrer: true,
      country: true,
      sessionId: true,
      createdAt: true,
    },
  });

  const pageViews = events.length;
  const sessionIds = new Set(events.map((event) => event.sessionId));
  const visitors = sessionIds.size;

  const dailyMap = new Map<string, { pageViews: number; sessions: Set<string> }>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { pageViews: 0, sessions: new Set() });
  }

  const pageCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();

  for (const event of events) {
    const dayKey = event.createdAt.toISOString().slice(0, 10);
    const bucket = dailyMap.get(dayKey);
    if (bucket) {
      bucket.pageViews += 1;
      bucket.sessions.add(event.sessionId);
    }

    pageCounts.set(event.path, (pageCounts.get(event.path) ?? 0) + 1);

    const country = event.country?.trim() || "Unknown";
    countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);

    const referrerLabel = formatReferrerLabel(event.referrer);
    referrerCounts.set(referrerLabel, (referrerCounts.get(referrerLabel) ?? 0) + 1);
  }

  const daily: WebAnalyticsDailyRow[] = Array.from(dailyMap.entries()).map(
    ([date, bucket]) => ({
      date,
      pageViews: bucket.pageViews,
      visitors: bucket.sessions.size,
    }),
  );

  const topPages = toRankedRows(
    Array.from(pageCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    pageViews,
  );

  const topCountries = toRankedRows(
    Array.from(countryCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    pageViews,
  );

  const topReferrers = toRankedRows(
    Array.from(referrerCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    pageViews,
  );

  return {
    rangeDays: days,
    pageViews,
    visitors,
    daily,
    topPages,
    topCountries,
    topReferrers,
  };
}

export async function recordSiteAnalyticsEvent(input: {
  path: string;
  referrer?: string | null;
  country?: string | null;
  sessionId: string;
  deviceId?: string | null;
  source?: string;
}): Promise<void> {
  const path = input.path.trim().slice(0, 500);
  if (!path.startsWith("/")) return;

  await prisma.siteAnalyticsEvent.create({
    data: {
      eventType: "pageview",
      path,
      referrer: input.referrer?.trim().slice(0, 500) ?? null,
      country: input.country?.trim().slice(0, 80) ?? null,
      sessionId: input.sessionId.slice(0, 120),
      deviceId: input.deviceId?.slice(0, 120) ?? null,
      source: input.source ?? "app",
    },
  });
}
