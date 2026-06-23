"use client";

import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { useAuditionSubmissions } from "@/components/providers/audition-submissions-provider";
import { Tooltip } from "@/components/ui/tooltip";
import {
  auditionStatusVariant,
  getAuditionDisplayStatus,
  getAuditionStatusLabel,
} from "@/lib/audition-status";
import { ACTOR_APPLICATION_STATUS_LABELS } from "@/lib/application-status";
import type { ActorDashboardStats } from "@/lib/data/projects";
import {
  formatMonthKey,
  getRecentMonthOptions,
} from "@/lib/date-ranges";
import { cn, formatDate, formatRelativeDate } from "@/lib/utils";
import type { Application, Audition } from "@/types";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Eye,
  FileText,
  Search,
  Sparkles,
  TrendingUp,
  UserCircle,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PREMIUM_TOOLTIP =
  "Your analytics will unlock with a Premium account after 30 days of activity. Upgrade to access Actor Insights, advanced metrics, and priority visibility.";

const statusVariant: Record<
  string,
  "success" | "warning" | "info" | "accent" | "default" | "danger"
> = {
  submitted: "default",
  audition_viewed: "info",
  reviewing: "info",
  audition_requested: "accent",
  callback: "accent",
  accepted: "success",
  rejected: "danger",
};

const statLinks = [
  "/actor/applications",
  "/actor/auditions",
  null,
  null,
] as const;

const statMeta = [
  {
    label: "Submissions",
    icon: FileText,
    accent: "from-accent/20 to-amber-100/40",
    iconClass: "text-accent",
  },
  {
    label: "Auditions",
    icon: Video,
    accent: "from-violet-500/15 to-fuchsia-500/10",
    iconClass: "text-violet-600",
  },
  {
    label: "Audition Success Rate",
    icon: TrendingUp,
    accent: "from-emerald-500/15 to-teal-500/10",
    iconClass: "text-emerald-600",
  },
  {
    label: "Profile views",
    icon: Eye,
    accent: "from-sky-500/15 to-blue-500/10",
    iconClass: "text-sky-600",
  },
];

interface ActorDashboardClientProps {
  userName: string;
  stats: ActorDashboardStats;
  applications: Application[];
  auditions: Audition[];
  isPremium: boolean;
  isEmailVerified?: boolean;
  userEmail?: string;
  missingProfileFields?: string[];
}

export function ActorDashboardClient({
  userName,
  stats,
  applications,
  auditions,
  isPremium,
  isEmailVerified = true,
  userEmail,
  missingProfileFields = [],
}: ActorDashboardClientProps) {
  const monthOptions = useMemo(() => getRecentMonthOptions(12), []);
  const currentMonthKey = useMemo(
    () => formatMonthKey(new Date().getFullYear(), new Date().getMonth()),
    [],
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);
  const [fetchedStats, setFetchedStats] = useState<ActorDashboardStats | null>(
    null,
  );
  const [statsLoading, setStatsLoading] = useState(false);

  const isCurrentMonth = selectedMonthKey === currentMonthKey;
  const displayStats = isCurrentMonth ? stats : (fetchedStats ?? stats);

  const selectMonthKey = (key: string) => {
    setSelectedMonthKey(key);
    setStatsLoading(key !== currentMonthKey);
  };

  const firstName = userName.split(" ")[0];
  const { isSubmitted } = useAuditionSubmissions();
  const upcomingAuditions = auditions.filter(
    (a) => a.status === "requested" || a.status === "submitted",
  );
  const pendingAuditions = upcomingAuditions.filter(
    (a) => a.status === "requested" && !isSubmitted(a.id, a.status),
  ).length;

  const auditionByRoleId = useMemo(() => {
    const map = new Map<string, Audition>();
    for (const audition of auditions) {
      if (audition.roleId) map.set(audition.roleId, audition);
    }
    return map;
  }, [auditions]);

  function getSubmissionBadge(app: Application) {
    const audition = auditionByRoleId.get(app.roleId);
    if (audition) {
      const submitted = isSubmitted(audition.id, audition.status);
      const auditionDisplay = submitted
        ? "submitted"
        : getAuditionDisplayStatus(audition);

      if (auditionDisplay === "submitted") {
        return {
          label: getAuditionStatusLabel("submitted"),
          variant: auditionStatusVariant.submitted ?? "accent",
        };
      }

      if (auditionDisplay === "requested") {
        return {
          label: getAuditionStatusLabel("requested"),
          variant: auditionStatusVariant.requested ?? "accent",
        };
      }
    }

    return {
      label: ACTOR_APPLICATION_STATUS_LABELS[app.status],
      variant: statusVariant[app.status] ?? "default",
    };
  }

  const selectedMonthIndex = monthOptions.findIndex(
    (option) => option.key === selectedMonthKey,
  );
  const canGoToOlderMonth =
    selectedMonthIndex >= 0 && selectedMonthIndex < monthOptions.length - 1;
  const canGoToNewerMonth = selectedMonthIndex > 0;

  useEffect(() => {
    if (isCurrentMonth) return;

    let cancelled = false;

    fetch(`/api/analytics/actor?month=${encodeURIComponent(selectedMonthKey)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data.stats) {
          setFetchedStats(data.stats as ActorDashboardStats);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchedStats(null);
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMonthKey, isCurrentMonth]);

  const statCards = [
    {
      label: "Submissions",
      value: displayStats.applicationsSubmitted,
      change: displayStats.applicationsChange,
    },
    {
      label: "Auditions",
      value: displayStats.auditionsReceived,
      change: displayStats.auditionsChange,
    },
    {
      label: "Audition Success Rate",
      value: `${displayStats.callbackRate}%`,
      change: displayStats.callbackChange,
    },
    {
      label: "Profile views",
      value: displayStats.profileViews.toLocaleString(),
      change: displayStats.profileViewsChange,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {!isEmailVerified && userEmail && (
        <EmailVerificationBanner email={userEmail} />
      )}

      {/* Welcome hero */}
      <section
        className="relative overflow-hidden rounded-[24px] border border-accent/20 bg-[linear-gradient(135deg,#fffefb_0%,#faf6ee_42%,#f5f0ff_100%)] shadow-[var(--shadow-card)]"
      >
        <div className="pointer-events-none absolute -top-16 -right-12 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary leading-tight">
                Welcome back,{" "}
                <span className="text-gradient-gold">{firstName}</span>
              </h1>
              <p className="text-sm text-text-secondary mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-accent" />
                  {pendingAuditions} pending auditions
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isPremium && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  <Sparkles className="h-3 w-3" />
                  Premium
                </span>
              )}
              <NotificationsBell />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/actor/search">
              <Button
                size="sm"
                className="h-9 text-xs gap-1.5 bg-gradient-to-r from-[#c8a86b] via-[#d4b87a] to-[#b58d4b] text-text-primary font-semibold border border-accent/30 shadow-sm hover:brightness-105"
              >
                <Search className="h-3.5 w-3.5" />
                Breakdowns
              </Button>
            </Link>
            <Link href="/actor/profile">
              <Button variant="secondary" size="sm" className="h-9 text-xs gap-1.5">
                <UserCircle className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </Link>
          </div>

          <div
            className={cn(
              "mt-4 flex flex-col gap-3 sm:flex-row sm:items-end",
              missingProfileFields.length > 0 ? "sm:justify-between" : "justify-end",
            )}
          >
            {missingProfileFields.length > 0 ? (
              <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
                Complete your profile before applying.{" "}
                <Link
                  href="/actor/profile"
                  className="font-medium text-accent hover:text-accent-hover transition-colors"
                >
                  Finish your profile
                </Link>
              </p>
            ) : null}
            <div className="inline-flex items-center gap-1 rounded-lg border border-border/25 bg-white/35 px-0.5 py-0.5 shrink-0 self-end sm:self-auto backdrop-blur-sm">
              <button
                type="button"
                aria-label="Previous month"
                disabled={!canGoToOlderMonth || statsLoading}
                onClick={() => {
                  if (!canGoToOlderMonth) return;
                  selectMonthKey(monthOptions[selectedMonthIndex + 1].key);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary/55 hover:text-text-secondary hover:bg-white/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <label htmlFor="actor-dashboard-month" className="sr-only">
                Select month
              </label>
              <div className="flex items-center gap-1.5 px-1">
                <Calendar className="h-3.5 w-3.5 text-text-secondary/50 shrink-0" />
                <select
                  id="actor-dashboard-month"
                  value={selectedMonthKey}
                  disabled={statsLoading}
                  onChange={(e) => selectMonthKey(e.target.value)}
                  className="text-[11px] font-medium uppercase tracking-widest text-text-secondary/60 bg-transparent border-0 py-1 pr-1 focus:outline-none focus:ring-0 cursor-pointer disabled:opacity-60"
                >
                  {monthOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                aria-label="Next month"
                disabled={!canGoToNewerMonth || statsLoading}
                onClick={() => {
                  if (!canGoToNewerMonth) return;
                  selectMonthKey(monthOptions[selectedMonthIndex - 1].key);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary/55 hover:text-text-secondary hover:bg-white/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div
        className={cn(
          "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 transition-opacity",
          statsLoading && "opacity-60",
        )}
      >
        {statCards.map((stat, index) => {
          const meta = statMeta[index];
          const Icon = meta.icon;
          const href = statLinks[index];
          const cardInner = (
            <>
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-100",
                  meta.accent,
                )}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-bg-secondary/80 backdrop-blur-sm",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", meta.iconClass)} />
                  </div>
                  {stat.change !== undefined && stat.change !== 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold tabular-nums",
                        stat.change >= 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {stat.change >= 0 ? "+" : ""}
                      {stat.change}%
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold tracking-tight text-text-primary mt-1 tabular-nums">
                  {stat.value}
                </p>
              </div>
            </>
          );
          const cardClass = cn(
            "group relative overflow-hidden rounded-[20px] border border-border/60 bg-bg-secondary px-4 py-5 sm:px-5 sm:py-6 min-h-[7.25rem]",
            "shadow-[var(--shadow-soft)] transition-all duration-300",
            href &&
              "hover:border-accent/35 hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5 cursor-pointer",
          );

          return href ? (
            <Link key={stat.label} href={href} className={cardClass}>
              {cardInner}
            </Link>
          ) : (
            <div key={stat.label} className={cardClass}>
              {cardInner}
            </div>
          );
        })}
      </div>

      {/* Upcoming auditions — full width */}
      <Card
        padding="sm"
        className="border-accent/10 bg-bg-secondary/90 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/15">
              <Clapperboard className="h-4 w-4 text-violet-600" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">
              Upcoming Auditions
            </h2>
          </div>
          <Link
            href="/actor/auditions"
            className="text-[11px] font-semibold text-accent hover:text-accent-hover transition-colors flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-accent/5"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-1">
          {upcomingAuditions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-bg-sidebar/40 px-4 py-8 text-center">
              <Video className="h-8 w-8 text-text-secondary/40 mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No upcoming auditions.</p>
              <Link
                href="/actor/search"
                className="text-xs font-medium text-accent hover:text-accent-hover mt-2 inline-block"
              >
                Browse breakdowns
              </Link>
            </div>
          ) : (
            upcomingAuditions.slice(0, 5).map((audition) => {
              const submitted = isSubmitted(audition.id, audition.status);
              const displayStatus = submitted
                ? "submitted"
                : getAuditionDisplayStatus(audition);
              return (
                <Link
                  key={audition.id}
                  href={`/actor/auditions/${audition.id}`}
                  className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border border-transparent hover:border-accent/15 hover:bg-gradient-to-r hover:from-accent/5 hover:to-transparent transition-all duration-200"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                      {audition.projectTitle}
                    </p>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {audition.roleName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-text-secondary hidden sm:flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="h-3 w-3" />
                      {formatDate(audition.deadline)}
                    </span>
                    <Badge
                      variant={auditionStatusVariant[displayStatus] ?? "default"}
                      className="text-[10px] px-2 py-0.5"
                    >
                      {getAuditionStatusLabel(displayStatus)}
                    </Badge>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </Card>

      {/* Recent submissions — full width */}
      <Card
        padding="sm"
        className="border-accent/10 bg-bg-secondary/90 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/15">
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">
              Recent Submissions
            </h2>
          </div>
          <Link
            href="/actor/applications"
            className="text-[11px] font-semibold text-accent hover:text-accent-hover transition-colors flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-accent/5"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-1">
          {applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-bg-sidebar/40 px-4 py-8 text-center">
              <FileText className="h-8 w-8 text-text-secondary/40 mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No submissions yet.</p>
              <Link
                href="/actor/search"
                className="text-xs font-medium text-accent hover:text-accent-hover mt-2 inline-block"
              >
                Find roles to apply
              </Link>
            </div>
          ) : (
            applications.slice(0, 5).map((app) => {
              const submissionBadge = getSubmissionBadge(app);
              return (
              <Link
                key={app.id}
                href={`/actor/roles/${app.roleId}?from=submissions`}
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border border-transparent hover:border-accent/15 hover:bg-gradient-to-r hover:from-accent/5 hover:to-transparent transition-all duration-200"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                    {app.projectTitle}
                  </p>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {app.roleName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-text-secondary hidden sm:block">
                    {formatRelativeDate(app.submittedAt)}
                  </span>
                  <Badge
                    variant={submissionBadge.variant}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {submissionBadge.label}
                  </Badge>
                </div>
              </Link>
              );
            })
          )}
        </div>
      </Card>

      {!isPremium && (
        <div
          className="relative overflow-hidden rounded-[24px] border border-accent/25 shadow-[var(--shadow-card)]"
        >
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,168,107,0.25),transparent_55%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

          <div className="relative px-5 py-5 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/30 to-fuchsia-500/20 border border-white/10 shadow-inner">
                <Sparkles className="h-5 w-5 text-[#e8d5a8]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Actor Insights — Premium
                </h3>
                <p className="text-xs text-white/55 mt-0.5 leading-relaxed">
                  Analytics, featured visibility, and career recommendations.
                </p>
              </div>
            </div>
            <Tooltip content={PREMIUM_TOOLTIP}>
              <Button
                variant="accent"
                size="sm"
                className="h-9 text-xs shrink-0 px-5 font-semibold shadow-lg"
              >
                Upgrade to Premium
              </Button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
