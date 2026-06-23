"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CastingDeadline,
  CastingInsight,
  CalendarEvent,
  DashboardNotification,
} from "@/lib/casting-dashboard-data";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useMemo, useState } from "react";

export function AiInsightsPanel({ insights }: { insights: CastingInsight[] }) {
  const styles: Record<CastingInsight["type"], string> = {
    positive: "border-success/20 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    tip: "border-accent/30 bg-accent/5",
    success: "border-info/20 bg-info/5",
  };

  return (
    <Card padding="sm">
      <CardHeader className="mb-2">
        <CardTitle className="text-sm">Insights</CardTitle>
        <Badge variant="accent" className="text-[10px]">Smart</Badge>
      </CardHeader>
      <div className="space-y-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={cn(
              "rounded-xl border px-3 py-2 transition-all duration-300 hover:shadow-[var(--shadow-soft)]",
              styles[insight.type],
            )}
          >
            <p className="text-xs text-text-primary leading-snug">
              <span className="mr-1.5">{insight.emoji}</span>
              {insight.message}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ProjectHealthCards({
  projects,
  title = "Project Health",
}: {
  projects: Array<{
    id: string;
    name: string;
    healthScore: number;
    submissionProgress: number;
    reviewProgress: number;
    deadline: string;
  }>;
  title?: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(() => {
    const sorted = [...projects].sort((a, b) => a.deadline.localeCompare(b.deadline));
    return sorted[0]?.id ?? "all";
  });

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [projects],
  );

  const visibleProjects = useMemo(() => {
    if (selectedId === "all") return sortedProjects;
    return sortedProjects.filter((p) => p.id === selectedId);
  }, [sortedProjects, selectedId]);

  return (
    <Card padding="md">
      <CardHeader className="mb-4 flex-col sm:flex-row gap-3 sm:items-center">
        <CardTitle>{title}</CardTitle>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="h-9 rounded-xl border border-border bg-bg-primary px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 max-w-xs"
          aria-label="Filter performance health by project"
        >
          <option value="all">All projects</option>
          {sortedProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {formatDate(p.deadline)}
            </option>
          ))}
        </select>
      </CardHeader>
      <div className="space-y-4">
        {visibleProjects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block rounded-2xl border border-border/60 p-4 hover:border-accent/40 hover:bg-bg-sidebar/30 transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="font-semibold text-text-primary truncate">{project.name}</p>
              <span className="text-sm font-bold text-accent">{project.healthScore}</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                  <span>Submissions</span>
                  <span>{project.submissionProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-bg-sidebar overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${project.submissionProgress}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                  <span>Reviews</span>
                  <span>{project.reviewProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-bg-sidebar overflow-hidden">
                  <div
                    className="h-full bg-text-primary/70 rounded-full transition-all duration-500"
                    style={{ width: `${project.reviewProgress}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-text-secondary mt-2">
              Deadline {formatDate(project.deadline)}
            </p>
          </Link>
        ))}
        {visibleProjects.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-6">
            No projects match this filter.
          </p>
        )}
      </div>
    </Card>
  );
}

export function UpcomingDeadlines({ deadlines }: { deadlines: CastingDeadline[] }) {
  const typeLabel: Record<CastingDeadline["type"], string> = {
    submission: "Submission",
    audition: "Audition",
    callback: "Callback",
    shoot: "Shoot",
  };

  return (
    <Card padding="md">
      <CardHeader className="mb-4">
        <CardTitle>Upcoming Deadlines</CardTitle>
      </CardHeader>
      <div className="space-y-2">
        {deadlines.map((d) => (
          <div
            key={d.id}
            className={cn(
              "flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5",
              d.overdue
                ? "border-danger/30 bg-danger/5"
                : "border-border/60 bg-bg-primary/30",
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{d.title}</p>
              <p className="text-xs text-text-secondary truncate">{d.projectTitle}</p>
            </div>
            <div className="text-right shrink-0">
              <Badge
                variant={d.overdue ? "danger" : "outline"}
                className="text-[10px] mb-1"
              >
                {typeLabel[d.type]}
              </Badge>
              <p className="text-xs text-text-secondary">{formatDate(d.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NotificationsWidget({
  notifications,
}: {
  notifications: DashboardNotification[];
}) {
  const total = notifications.reduce((sum, n) => sum + n.count, 0);

  return (
    <Card padding="md">
      <CardHeader className="mb-3">
        <CardTitle className="text-base">Notifications</CardTitle>
        {total > 0 && (
          <Badge variant="accent" className="text-[10px]">{total} new</Badge>
        )}
      </CardHeader>
      <div className="space-y-1">
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-bg-sidebar/60 transition-colors"
          >
            <span className="text-sm text-text-secondary">{n.label}</span>
            {n.count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white px-1">
                {n.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function CalendarWidget({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(today);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const eventDates = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const typeColor: Record<CalendarEvent["type"], string> = {
    audition: "bg-accent",
    callback: "bg-info",
    shoot: "bg-success",
    deadline: "bg-warning",
  };

  return (
    <Card padding="md">
      <CardHeader className="mb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-text-secondary" />
          {monthLabel}
        </CardTitle>
      </CardHeader>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-text-secondary mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventDates.get(dateKey);
          const isToday = day === today.getDate();
          return (
            <div
              key={day}
              className={cn(
                "relative h-8 rounded-lg flex flex-col items-center justify-center text-xs",
                isToday && "bg-accent/15 font-bold text-accent",
                dayEvents && !isToday && "bg-bg-sidebar",
              )}
            >
              {day}
              {dayEvents && (
                <span className="absolute bottom-0.5 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={cn("h-1 w-1 rounded-full", typeColor[e.type])}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
        {events.slice(0, 4).map((e) => (
          <div key={e.id} className="flex items-center gap-2 text-xs">
            <span className={cn("h-2 w-2 rounded-full shrink-0", typeColor[e.type])} />
            <span className="text-text-secondary truncate">
              {formatDate(e.date)} · {e.title} — {e.projectTitle}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
