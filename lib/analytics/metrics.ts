import {
  BUSINESS_ANALYTICS_EVENT_TYPES,
  BUSINESS_EVENT_LABELS,
} from "@/lib/analytics/events";
import { prisma } from "@/lib/prisma";
import type { BusinessAnalyticsEventType } from "@prisma/client";
import { Prisma } from "@prisma/client";

export interface PeriodMetrics {
  daily: number;
  weekly: number;
  monthly: number;
  lifetime: number;
}

export interface MetricRow {
  key: BusinessAnalyticsEventType | "visitors";
  label: string;
  metrics: PeriodMetrics;
}

export interface AdminAnalyticsDashboard {
  generatedAt: string;
  rows: MetricRow[];
}

function startOfTodayUtc(): Date {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function daysAgoUtc(days: number): Date {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days);
  return start;
}

async function countDistinctVisitors(since?: Date): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(DISTINCT "sessionId")::int AS count
    FROM "SiteAnalyticsEvent"
    WHERE "eventType" = 'pageview'
    ${since ? Prisma.sql`AND "createdAt" >= ${since}` : Prisma.empty}
  `;

  return rows[0]?.count ?? 0;
}

async function countEventsByType(since?: Date): Promise<Map<string, number>> {
  const grouped = await prisma.businessAnalyticsEvent.groupBy({
    by: ["eventType"],
    where: since ? { createdAt: { gte: since } } : undefined,
    _count: { _all: true },
  });

  const map = new Map<string, number>();
  for (const row of grouped) {
    map.set(row.eventType, row._count._all);
  }
  return map;
}

function buildPeriodMetrics(
  key: string,
  dailyMap: Map<string, number>,
  weeklyMap: Map<string, number>,
  monthlyMap: Map<string, number>,
  lifetimeMap: Map<string, number>,
): PeriodMetrics {
  return {
    daily: dailyMap.get(key) ?? 0,
    weekly: weeklyMap.get(key) ?? 0,
    monthly: monthlyMap.get(key) ?? 0,
    lifetime: lifetimeMap.get(key) ?? 0,
  };
}

export async function getAdminAnalyticsDashboard(): Promise<AdminAnalyticsDashboard> {
  const dailyStart = startOfTodayUtc();
  const weeklyStart = daysAgoUtc(6);
  const monthlyStart = daysAgoUtc(29);

  const [
    visitorsDaily,
    visitorsWeekly,
    visitorsMonthly,
    visitorsLifetime,
    dailyMap,
    weeklyMap,
    monthlyMap,
    lifetimeMap,
  ] = await Promise.all([
    countDistinctVisitors(dailyStart),
    countDistinctVisitors(weeklyStart),
    countDistinctVisitors(monthlyStart),
    countDistinctVisitors(),
    countEventsByType(dailyStart),
    countEventsByType(weeklyStart),
    countEventsByType(monthlyStart),
    countEventsByType(),
  ]);

  const visitorMetrics: PeriodMetrics = {
    daily: visitorsDaily,
    weekly: visitorsWeekly,
    monthly: visitorsMonthly,
    lifetime: visitorsLifetime,
  };

  const rows: MetricRow[] = [
    {
      key: "visitors",
      label: "Website visitors",
      metrics: visitorMetrics,
    },
    ...BUSINESS_ANALYTICS_EVENT_TYPES.map((eventType) => ({
      key: eventType,
      label: BUSINESS_EVENT_LABELS[eventType],
      metrics: buildPeriodMetrics(
        eventType,
        dailyMap,
        weeklyMap,
        monthlyMap,
        lifetimeMap,
      ),
    })),
  ];

  return {
    generatedAt: new Date().toISOString(),
    rows,
  };
}
