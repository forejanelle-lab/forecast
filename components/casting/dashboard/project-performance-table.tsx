"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import type { ProjectPerformanceRow } from "@/lib/casting-dashboard-data";
import {
  getHealthImprovementTips,
  isLowHealthScore,
} from "@/lib/casting-project-health";
import { cn, formatDate } from "@/lib/utils";
import type { ProjectStatus } from "@/types";
import { ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type SortKey = keyof Pick<
  ProjectPerformanceRow,
  | "name"
  | "status"
  | "submissions"
  | "reviewed"
  | "pendingAuditionReview"
  | "rolesBooked"
  | "healthScore"
  | "deadline"
>;
type StatusFilter = "all" | "active" | "completed";

function healthColor(score: number) {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-accent";
  if (score >= 50) return "text-warning";
  return "text-danger";
}

function statusBadgeVariant(status: ProjectStatus) {
  if (status === "active") return "success";
  if (status === "completed") return "outline";
  if (status === "draft") return "outline";
  return "outline";
}

function formatDeadline(deadline: string) {
  if (!deadline?.trim()) return "No deadline";
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return "No deadline";
  return formatDate(deadline);
}

function formatStatus(status: ProjectStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function HealthScoreCell({ row }: { row: ProjectPerformanceRow }) {
  const healthTip = getHealthImprovementTips({
    healthScore: row.healthScore,
    submissions: row.submissions,
    reviewed: row.reviewed,
    auditions: row.auditions,
    pendingAuditionReview: row.pendingAuditionReview,
    roleCount: row.roleCount,
    openRoles: row.openRoles,
    rolesBooked: row.rolesBooked,
    deadline: row.deadline,
    status: row.status,
  });

  const scoreDisplay = (
    <span className={cn("font-semibold", healthColor(row.healthScore))}>
      {row.healthScore}
    </span>
  );

  if (!isLowHealthScore(row.healthScore) || !healthTip) {
    return scoreDisplay;
  }

  return (
    <Tooltip content={healthTip} side="top">
      <span
        title={healthTip}
        className="inline-flex cursor-help underline decoration-dotted decoration-text-secondary/50 underline-offset-2"
      >
        {scoreDisplay}
      </span>
    </Tooltip>
  );
}

export function ProjectPerformanceTable({ rows }: { rows: ProjectPerformanceRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let list = rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (normalized && !row.name.toLowerCase().includes(normalized)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      if (sortKey === "deadline") {
        const aEmpty = !a.deadline?.trim();
        const bEmpty = !b.deadline?.trim();
        if (aEmpty !== bEmpty) {
          return sortAsc ? (aEmpty ? 1 : -1) : (aEmpty ? -1 : 1);
        }
      }

      if (typeof av === "string" && typeof bv === "string") {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc
        ? Number(av) - Number(bv)
        : Number(bv) - Number(av);
    });
    return list;
  }, [rows, query, statusFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <Card padding="md" className="w-full">
      <CardHeader className="mb-4 w-full">
        <div className="flex items-center gap-4 w-full min-w-0">
          <div className="flex-1 min-w-0">
            <Input
              icon
              placeholder="Search Projects..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 text-xs w-full"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {(["all", "active", "completed"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  statusFilter === f
                    ? "bg-text-primary text-white border-text-primary"
                    : "border-border text-text-secondary hover:text-text-primary",
                )}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full min-w-[1080px] text-xs">
          <thead>
            <tr className="border-b border-border/60 text-left text-[9px] font-semibold text-text-secondary uppercase tracking-wide">
              <th className="py-1.5 pr-4 min-w-[200px]">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  Project <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-1.5 px-4 min-w-[90px]">
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  Status <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-1.5 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort("submissions")}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  Submissions <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-1.5 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort("reviewed")}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  Reviewed <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-1.5 px-4 min-w-[130px]">
                <button
                  type="button"
                  onClick={() => toggleSort("pendingAuditionReview")}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  Auditions to Review <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-1.5 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort("rolesBooked")}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  Roles booked <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-1.5 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort("deadline")}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  Deadline <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-1.5 pl-4">
                <Tooltip
                  content="Health reflects booked roles, submission reviews, audition follow-up, and deadlines. Hover a low score for details."
                  side="top"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort("healthScore")}
                    className="flex items-center gap-1 hover:text-text-primary cursor-help"
                  >
                    Health <ArrowUpDown className="h-3 w-3" />
                  </button>
                </Tooltip>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                onClick={() => router.push(`/projects/${row.id}`)}
                className="border-b border-border/40 hover:bg-bg-sidebar/50 transition-colors cursor-pointer"
              >
                <td className="py-2 pr-4 leading-tight font-medium text-text-primary">
                  {row.name}
                </td>
                <td className="py-2 px-4 leading-tight">
                  <Badge variant={statusBadgeVariant(row.status)} className="text-[9px]">
                    {formatStatus(row.status)}
                  </Badge>
                </td>
                <td className="py-2 px-4 text-text-primary font-medium leading-tight">
                  {row.submissions}
                </td>
                <td className="py-2 px-4 text-text-secondary leading-tight">
                  {row.reviewed}
                </td>
                <td className="py-2 px-4 text-text-secondary leading-tight">
                  {row.pendingAuditionReview}
                </td>
                <td className="py-2 px-4 text-text-primary font-medium leading-tight">
                  {row.rolesBooked}
                </td>
                <td className="py-2 px-4 text-text-secondary leading-tight whitespace-nowrap">
                  {formatDeadline(row.deadline)}
                </td>
                <td
                  className="py-2 pl-4 leading-tight"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HealthScoreCell row={row} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border/60">
              <td
                colSpan={8}
                className="py-2.5 pr-4 text-xs text-text-secondary"
              >
                Showing {filtered.length} project{filtered.length === 1 ? "" : "s"}
              </td>
            </tr>
          </tfoot>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">
            No projects match your filters.
          </p>
        )}
      </div>
    </Card>
  );
}
