"use client";

import { Card } from "@/components/ui/card";
import { AreaTrendChart } from "@/components/ui/charts";
import type { WebAnalyticsSummary } from "@/lib/site-analytics";
import { cn, formatDate } from "@/lib/utils";
import { BarChart3, Eye, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
] as const;

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card padding="sm" className="border-border/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
            {label}
          </p>
          <p className="text-2xl font-bold text-text-primary mt-1 tabular-nums">
            {value.toLocaleString()}
          </p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br",
            accent,
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function RankedList({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: WebAnalyticsSummary["topPages"];
  emptyLabel: string;
}) {
  return (
    <Card padding="sm" className="border-border/60">
      <h2 className="text-sm font-semibold text-text-primary mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-text-secondary">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3">
              <span className="text-sm text-text-primary truncate">{row.label}</span>
              <span className="text-xs text-text-secondary tabular-nums shrink-0">
                {row.count.toLocaleString()} ({row.percentage}%)
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function CastingAnalyticsContent() {
  const [rangeDays, setRangeDays] = useState(7);
  const [summary, setSummary] = useState<WebAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/analytics/web?days=${rangeDays}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load analytics");
        }
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load analytics");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rangeDays]);

  const chartData = useMemo(
    () =>
      summary?.daily.map((row) => ({
        date: formatDate(row.date),
        pageViews: row.pageViews,
        visitors: row.visitors,
      })) ?? [],
    [summary],
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-accent" />
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Site Analytics
            </h1>
          </div>
          <p className="text-sm text-text-secondary max-w-2xl">
            Traffic captured by Vercel Web Analytics and in-app page tracking.
            View the full Vercel dashboard for additional breakdowns.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRangeDays(option.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                rangeDays === option.value
                  ? "border-accent bg-accent/10 text-text-primary"
                  : "border-border/60 text-text-secondary hover:border-accent/40",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card padding="md" className="border-border/60">
          <p className="text-sm text-text-secondary">Loading analytics…</p>
        </Card>
      ) : error ? (
        <Card padding="md" className="border-danger/30 bg-danger/5">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              label="Page views"
              value={summary.pageViews}
              icon={<Eye className="h-4 w-4 text-accent" />}
              accent="from-accent/20 to-amber-100/40"
            />
            <StatCard
              label="Visitors"
              value={summary.visitors}
              icon={<Users className="h-4 w-4 text-violet-600" />}
              accent="from-violet-500/15 to-fuchsia-500/10"
            />
          </div>

          <Card padding="sm" className="border-border/60">
            <h2 className="text-sm font-semibold text-text-primary mb-3">
              Traffic over time
            </h2>
            {chartData.length > 0 ? (
              <AreaTrendChart data={chartData} dataKey="pageViews" xKey="date" />
            ) : (
              <p className="text-sm text-text-secondary">
                No traffic recorded yet. Visit the site to generate page views.
              </p>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <RankedList
              title="Top pages"
              rows={summary.topPages}
              emptyLabel="No page views yet."
            />
            <RankedList
              title="Countries"
              rows={summary.topCountries}
              emptyLabel="No country data yet."
            />
            <RankedList
              title="Referrers"
              rows={summary.topReferrers}
              emptyLabel="No referrer data yet."
            />
          </div>

          <Card padding="sm" className="border-border/60 bg-bg-sidebar/30">
            <p className="text-xs text-text-secondary leading-relaxed">
              Enable Web Analytics in your Vercel project settings for the official
              Vercel dashboard. Optional: add a Web Analytics Drain pointing to{" "}
              <code className="text-text-primary">/api/webhooks/vercel-analytics</code>
              to sync Vercel events into this dashboard.
            </p>
          </Card>
        </>
      ) : null}
    </div>
  );
}
