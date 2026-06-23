"use client";

import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { CASTING_ANALYTICS_LOCKED_TOOLTIP } from "@/lib/casting-analytics-lock";
import { BarChart3 } from "lucide-react";

export function CastingAnalyticsContent() {
  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <Tooltip content={CASTING_ANALYTICS_LOCKED_TOOLTIP} side="bottom" className="w-full block">
        <Card
          padding="md"
          className="cursor-not-allowed border-border/60"
          aria-disabled="true"
        >
          <div className="flex flex-col items-center text-center py-10 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-sidebar text-text-secondary/50 mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
              Casting Analytics
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
              Upgrade to Premium and stay active for 30 days to unlock portfolio KPIs,
              trends, and insights.
            </p>
            <p className="text-xs text-text-secondary/80 leading-relaxed max-w-sm mt-3">
              {CASTING_ANALYTICS_LOCKED_TOOLTIP}
            </p>
          </div>
        </Card>
      </Tooltip>
    </div>
  );
}
