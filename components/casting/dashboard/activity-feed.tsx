"use client";

import { Avatar } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { CastingActivity } from "@/lib/casting-dashboard-data";
import { formatRelativeDate } from "@/lib/utils";
import Link from "next/link";

export function ActivityFeed({ activities }: { activities: CastingActivity[] }) {
  return (
    <Card padding="md">
      <CardHeader className="mb-4">
        <CardTitle>Recent Activity</CardTitle>
        <span className="text-xs text-text-secondary">Team & projects</span>
      </CardHeader>
      <div className="space-y-0">
        {activities.map((item, i) => (
          <div
            key={item.id}
            className="flex gap-3 py-3 border-b border-border/40 last:border-0 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Avatar initials={item.avatar} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary leading-snug">
                <span className="font-semibold">{item.user}</span>{" "}
                {item.action}{" "}
                {item.highlight && item.href ? (
                  <Link href={item.href} className="font-medium text-accent hover:text-accent-hover">
                    {item.highlight}
                  </Link>
                ) : (
                  item.highlight
                )}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {formatRelativeDate(item.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
