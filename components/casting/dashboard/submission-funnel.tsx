"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { FunnelStage, ProjectFunnel } from "@/lib/casting-dashboard-data";
import { cn, formatDate } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

function FunnelStages({ stages }: { stages: FunnelStage[] }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-stretch gap-3 lg:gap-2">
      {stages.map((stage, i) => (
        <div key={stage.stage} className="flex lg:flex-1 items-center gap-2 min-w-0">
          <div
            className={cn(
              "flex-1 rounded-2xl border border-border/60 bg-bg-primary/50 p-4",
              "transition-all duration-300 hover:border-accent/40 hover:shadow-[var(--shadow-soft)]",
            )}
          >
            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide truncate">
              {stage.stage}
            </p>
            <p className="text-xl font-bold text-text-primary mt-1">{stage.count}</p>
            <div className="flex items-center justify-between mt-2 gap-2">
              <span className="text-xs text-text-secondary">{stage.percentage}%</span>
              {stage.conversionFromPrev !== undefined && i > 0 && (
                <span className="text-[10px] text-accent font-medium">
                  {stage.conversionFromPrev}% conv.
                </span>
              )}
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-bg-sidebar overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                style={{ width: `${Math.min(stage.percentage, 100)}%` }}
              />
            </div>
          </div>
          {i < stages.length - 1 && (
            <ChevronRight
              className="h-4 w-4 text-text-secondary/50 shrink-0 hidden lg:block"
              aria-hidden
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface SubmissionFunnelProps {
  allStages: FunnelStage[];
  projectFunnels: ProjectFunnel[];
}

export function SubmissionFunnel({ allStages, projectFunnels }: SubmissionFunnelProps) {
  const [selectedId, setSelectedId] = useState<string>("all");

  const sortedProjects = useMemo(
    () => [...projectFunnels].sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [projectFunnels],
  );

  const selectedProject = sortedProjects.find((p) => p.projectId === selectedId);
  const showAllByProject = selectedId === "all";

  return (
    <Card padding="md" className="overflow-hidden">
      <CardHeader className="mb-4 flex-col sm:flex-row gap-3 sm:items-center">
        <div>
          <CardTitle>Submission Funnel</CardTitle>
          <span className="text-xs text-text-secondary">
            {showAllByProject
              ? "All projects · sorted by deadline"
              : `Due ${formatDate(selectedProject?.deadline ?? "")}`}
          </span>
        </div>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="h-9 rounded-xl border border-border bg-bg-primary px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 max-w-xs"
          aria-label="Filter funnel by project"
        >
          <option value="all">All projects (combined)</option>
          {sortedProjects.map((p) => (
            <option key={p.projectId} value={p.projectId}>
              {p.projectName} · {formatDate(p.deadline)}
            </option>
          ))}
        </select>
      </CardHeader>

      {showAllByProject ? (
        <div className="space-y-6">
          <FunnelStages stages={allStages} />
          <div className="border-t border-border/60 pt-6 space-y-6">
            {sortedProjects.map((project) => (
              <div key={project.projectId}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-sm font-semibold text-text-primary">
                    {project.projectName}
                  </p>
                  <span className="text-xs text-text-secondary">
                    Deadline {formatDate(project.deadline)}
                  </span>
                </div>
                <FunnelStages stages={project.stages} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <FunnelStages stages={selectedProject?.stages ?? allStages} />
      )}
    </Card>
  );
}
