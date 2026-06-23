"use client";

import { Card } from "@/components/ui/card";
import type { AdminAnalyticsDashboard } from "@/lib/analytics/metrics";
import { cn } from "@/lib/utils";
import { BarChart3, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const PERIOD_COLUMNS = [
  { key: "daily" as const, label: "Today" },
  { key: "weekly" as const, label: "7 days" },
  { key: "monthly" as const, label: "30 days" },
  { key: "lifetime" as const, label: "Lifetime" },
];

function formatGeneratedAt(value: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AdminAnalyticsDashboard() {
  const [dashboard, setDashboard] = useState<AdminAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/analytics", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load analytics dashboard.");
      }

      const data = (await response.json()) as AdminAnalyticsDashboard;
      setDashboard(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load analytics dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                "bg-gradient-to-br from-violet-500/20 to-indigo-500/20",
              )}
            >
              <BarChart3 className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Business metrics
              </h2>
              <p className="text-sm text-text-secondary">
                Privacy-conscious counts for signups, engagement, and conversions.
              </p>
            </div>
          </div>
          {dashboard?.generatedAt && (
            <p className="mt-2 text-xs text-text-secondary">
              Updated {formatGeneratedAt(dashboard.generatedAt)}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2",
            "text-sm font-medium text-text-primary hover:bg-bg-secondary disabled:opacity-60",
          )}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <Card padding="sm" className="border-border/60">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : loading && !dashboard ? (
          <p className="text-sm text-text-secondary">Loading metrics…</p>
        ) : dashboard ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left">
                  <th className="py-3 pr-4 font-medium text-text-secondary">Metric</th>
                  {PERIOD_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="py-3 px-3 font-medium text-text-secondary text-right tabular-nums"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.rows.map((row) => (
                  <tr key={row.key} className="border-b border-border/40 last:border-0">
                    <td className="py-3 pr-4 text-text-primary">{row.label}</td>
                    {PERIOD_COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        className="py-3 px-3 text-right font-medium tabular-nums text-text-primary"
                      >
                        {row.metrics[column.key].toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No metrics available yet.</p>
        )}
      </Card>

      <p className="text-xs text-text-secondary">
        Website traffic is tracked with Vercel Analytics and first-party page views.
        Business events store user IDs for counting only — no emails or message content.
        Set <code className="text-[11px]">ADMIN_EMAILS</code> to grant dashboard access.
      </p>
    </div>
  );
}
