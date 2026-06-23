"use client";

import { AreaTrendChart } from "@/components/ui/charts";
import type { CastingKpi } from "@/lib/casting-dashboard-data";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface DashboardKpiCardProps {
  kpi: CastingKpi;
  icon: React.ReactNode;
  index: number;
}

export function DashboardKpiCard({ kpi, icon, index }: DashboardKpiCardProps) {
  const isPositive = kpi.change >= 0;
  const trendKey = "value";

  return (
    <div
      className={cn(
        "group rounded-[20px] bg-bg-secondary border border-border/60 px-5 py-6 min-h-[9.5rem]",
        "shadow-[var(--shadow-soft)] transition-all duration-300",
        "hover:shadow-[var(--shadow-card)] hover:border-accent/40 hover:-translate-y-0.5",
        "animate-fade-in",
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            {kpi.label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mt-1">
            {kpi.value}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-success shrink-0" />
            )}
            <span className="text-xs font-semibold text-success">
              {isPositive ? "+" : ""}{kpi.change}%
            </span>
            <span className="text-xs text-text-secondary">vs last month</span>
          </div>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-sidebar text-accent transition-colors group-hover:bg-accent group-hover:text-white"
        >
          {icon}
        </div>
      </div>
      <div className="h-14 opacity-80 group-hover:opacity-100 transition-opacity">
        <AreaTrendChart
          data={kpi.trend}
          dataKey={trendKey}
          xKey="label"
          height={56}
          color="#C8A86B"
        />
      </div>
    </div>
  );
}
