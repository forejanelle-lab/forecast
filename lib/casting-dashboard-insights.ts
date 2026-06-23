import type { CastingInsight } from "@/lib/casting-dashboard-data";
import { isLowHealthScore } from "@/lib/casting-project-health";

export type CastingDashboardStats = {
  activeProjects: number;
  openRoles: number;
  totalSubmissions: number;
};

export type CastingDashboardProjectRow = {
  title: string;
  status: string;
  openRoles: number;
  rolesBooked: number;
  roleCount: number;
  pendingAuditionReview: number;
  performanceScore: number;
  deadline: string;
};

function daysUntilDeadline(deadline: string): number | null {
  if (!deadline?.trim()) return null;
  const deadlineMs = new Date(deadline).getTime();
  if (Number.isNaN(deadlineMs)) return null;
  return (deadlineMs - Date.now()) / (1000 * 60 * 60 * 24);
}

export function buildCastingDashboardInsights(
  stats: CastingDashboardStats,
  projects: CastingDashboardProjectRow[],
): CastingInsight[] {
  const insights: CastingInsight[] = [];
  const activeProjects = projects.filter((p) => p.status === "active");

  insights.push({
    id: "pipeline",
    type: "tip",
    emoji: "📊",
    message: `${stats.activeProjects} active project(s) with ${stats.openRoles} open role(s) in your pipeline.`,
  });

  const rolesBooked = projects.reduce((sum, p) => sum + p.rolesBooked, 0);
  if (rolesBooked > 0) {
    insights.push({
      id: "booked",
      type: "success",
      emoji: "⭐",
      message: `${rolesBooked} role(s) booked across your projects.`,
    });
  }

  const pendingAuditionReview = projects.reduce(
    (sum, p) => sum + p.pendingAuditionReview,
    0,
  );
  if (pendingAuditionReview > 0) {
    insights.push({
      id: "audition-review",
      type: "warning",
      emoji: "🎭",
      message: `${pendingAuditionReview} audition submission(s) need review in Review Auditions.`,
    });
  }

  const lowHealthProjects = activeProjects.filter((p) =>
    isLowHealthScore(p.performanceScore),
  );
  if (lowHealthProjects.length > 0) {
    const names = lowHealthProjects
      .slice(0, 2)
      .map((p) => p.title)
      .join(", ");
    const suffix =
      lowHealthProjects.length > 2
        ? ` and ${lowHealthProjects.length - 2} more`
        : "";
    insights.push({
      id: "low-health",
      type: "warning",
      emoji: "⚠️",
      message: `Low health on ${names}${suffix}. Hover Health in the table for how to improve.`,
    });
  }

  const soonDeadlines = activeProjects.filter((p) => {
    const days = daysUntilDeadline(p.deadline);
    return days !== null && days >= 0 && days <= 7 && p.openRoles > 0;
  });
  if (soonDeadlines.length > 0) {
    insights.push({
      id: "deadlines",
      type: "warning",
      emoji: "📅",
      message: `${soonDeadlines.length} active project(s) have submission deadlines within 7 days.`,
    });
  }

  if (stats.totalSubmissions === 0 && stats.openRoles > 0) {
    insights.push({
      id: "no-submissions",
      type: "tip",
      emoji: "💡",
      message:
        "No submissions yet on open roles. Share projects to attract applicants.",
    });
  }

  return insights;
}
