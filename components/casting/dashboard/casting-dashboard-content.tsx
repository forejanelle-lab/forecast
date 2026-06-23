"use client";

import { CastingWelcomeHeader } from "@/components/casting/dashboard/casting-header";
import { AiInsightsPanel } from "@/components/casting/dashboard/dashboard-widgets";
import { ProjectPerformanceTable } from "@/components/casting/dashboard/project-performance-table";
import { buildCastingDashboardInsights } from "@/lib/casting-dashboard-insights";
import type { CastingInsight, ProjectPerformanceRow } from "@/lib/casting-dashboard-data";
import type { ProjectStatus } from "@/types";
import { useMemo } from "react";

interface CastingDashboardContentProps {
  directorName: string;
  stats?: {
    activeProjects: number;
    openRoles: number;
    totalSubmissions: number;
    submissionsToday: number;
  } | null;
  projectPerformance?: Array<{
    id: string;
    title: string;
    roles: number;
    submissions: number;
    reviewed: number;
    auditions: number;
    pendingAuditionReview: number;
    rolesBooked: number;
    status: string;
    deadline: string;
    performanceScore: number;
    openRoles: number;
  }>;
}

export function CastingDashboardContent({
  directorName,
  stats,
  projectPerformance = [],
}: CastingDashboardContentProps) {
  const todayStats = useMemo(
    () => ({
      submissions: stats?.submissionsToday ?? 0,
      messages: 0,
      openRoles: stats?.openRoles ?? 0,
    }),
    [stats],
  );

  const performanceRows: ProjectPerformanceRow[] = projectPerformance.map((row) => ({
    id: row.id,
    name: row.title,
    status: row.status as ProjectStatus,
    submissions: row.submissions,
    pendingAuditionReview: row.pendingAuditionReview,
    reviewed: row.reviewed,
    auditions: row.auditions,
    rolesBooked: row.rolesBooked,
    deadline: row.deadline,
    healthScore: row.performanceScore,
    openRoles: row.openRoles,
    roleCount: row.roles,
  }));

  const castingInsights: CastingInsight[] = useMemo(
    () =>
      buildCastingDashboardInsights(
        {
          activeProjects: stats?.activeProjects ?? 0,
          openRoles: stats?.openRoles ?? 0,
          totalSubmissions: stats?.totalSubmissions ?? 0,
        },
        projectPerformance.map((row) => ({
          title: row.title,
          status: row.status,
          openRoles: row.openRoles,
          rolesBooked: row.rolesBooked,
          roleCount: row.roles,
          pendingAuditionReview: row.pendingAuditionReview,
          performanceScore: row.performanceScore,
          deadline: row.deadline,
        })),
      ),
    [stats, projectPerformance],
  );

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  return (
    <div className="animate-fade-in w-full min-w-0 max-w-full">
      <CastingWelcomeHeader
        directorName={directorName}
        dateLabel={dateLabel}
        todayStats={todayStats}
      />

      <section className="mb-8">
        <ProjectPerformanceTable rows={performanceRows} />
      </section>

      <section className="mb-8">
        <AiInsightsPanel insights={castingInsights} />
      </section>
    </div>
  );
}
