"use client";

import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import Link from "next/link";

export function CastingWelcomeHeader({
  directorName,
  dateLabel,
  todayStats,
}: {
  directorName: string;
  dateLabel: string;
  todayStats: { submissions: number; messages: number };
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="mb-8 animate-fade-in">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-4 mb-0">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            {greeting},{" "}
            <span
              className="bg-gradient-to-r from-[#c8a86b] via-[#e8d5a8] to-[#b58d4b] bg-clip-text text-transparent"
            >
              {directorName}
            </span>
            {" "}
            👋
          </h1>
          <NotificationsBell />
        </div>
        <div className="mt-2 space-y-1.5 text-sm text-text-secondary">
          <p>{dateLabel}</p>
          <p>
            Today:{" "}
            <strong
              className="bg-gradient-to-r from-[#c8a86b] via-[#e8d5a8] to-[#b58d4b] bg-clip-text text-transparent"
            >
              {todayStats.submissions}
            </strong>{" "}
            submissions
          </p>
        </div>
        <div className="flex gap-2 mt-3">
          <Link href="/projects/roles/new" className="w-[8.25rem] shrink-0">
            <Button
              variant="secondary"
              className="h-8 w-full px-3 text-xs font-medium rounded-lg"
            >
              + Create Role
            </Button>
          </Link>
          <Link href="/projects/new" className="w-[8.25rem] shrink-0">
            <Button
              variant="primary"
              className="h-8 w-full px-3 text-xs font-medium rounded-lg border border-transparent shadow-[var(--shadow-soft)]"
            >
              + New Project
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
