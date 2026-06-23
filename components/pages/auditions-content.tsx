"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuditionSubmissions } from "@/components/providers/audition-submissions-provider";
import {
  auditionStatusVariant,
  getAuditionDisplayStatus,
} from "@/lib/audition-status";
import { formatDate } from "@/lib/utils";
import type { Audition } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function AuditionsContent({ auditions }: { auditions: Audition[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { isSubmitted } = useAuditionSubmissions();

  const filteredAuditions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const sorted = [...auditions].sort((a, b) =>
      a.deadline.localeCompare(b.deadline),
    );
    if (!normalized) return sorted;
    return sorted.filter(
      (audition) =>
        audition.projectTitle.toLowerCase().includes(normalized) ||
        audition.roleName.toLowerCase().includes(normalized),
    );
  }, [auditions, query]);

  return (
    <div className="space-y-4 animate-fade-in max-w-none">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Auditions
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Manage audition requests, self tapes, and callbacks.
        </p>
      </div>

      <Input
        icon
        placeholder="Search by project or role..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-9 text-sm"
      />

      <div className="-mx-8 -mr-8">
        {filteredAuditions.length === 0 ? (
          <p className="text-xs text-text-secondary py-6 text-center px-8">
            {query.trim()
              ? "No auditions match your search."
              : "No audition requests yet."}
          </p>
        ) : (
          <table className="w-full text-xs table-fixed">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[28%]" />
              <col className="w-[24%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th className="py-2 pl-8 pr-3 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  Requested
                </th>
                <th className="py-2 px-3 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  Project Title
                </th>
                <th className="py-2 px-3 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  Role
                </th>
                <th className="py-2 px-3 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  Deadline
                </th>
                <th className="py-2 px-3 pr-8 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditions.map((audition) => {
                const submitted = isSubmitted(audition.id, audition.status);
                const displayStatus = submitted
                  ? "submitted"
                  : getAuditionDisplayStatus(audition);
                return (
                <tr
                  key={audition.id}
                  onClick={() => router.push(`/actor/auditions/${audition.id}`)}
                  className="border-b border-border/40 hover:bg-bg-sidebar/60 transition-colors cursor-pointer"
                >
                  <td className="py-2 pl-8 pr-3 text-text-secondary leading-tight">
                    {formatDate(audition.requestedAt)}
                  </td>
                  <td className="py-2 px-3 font-medium leading-tight">
                    {audition.projectId ? (
                      <Link
                        href={`/actor/projects/${audition.projectId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-text-primary hover:text-accent transition-colors"
                      >
                        {audition.projectTitle}
                      </Link>
                    ) : (
                      <span className="text-text-primary">{audition.projectTitle}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-text-secondary leading-tight">
                    {audition.roleName}
                  </td>
                  <td className="py-2 px-3 text-text-secondary leading-tight">
                    {formatDate(audition.deadline)}
                  </td>
                  <td className="py-2 px-3 pr-8 leading-tight">
                    <Badge
                      variant={auditionStatusVariant[displayStatus] ?? "default"}
                      className="text-[10px] px-2 py-0.5"
                    >
                      {displayStatus}
                    </Badge>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
