"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuditionSubmissions } from "@/components/providers/audition-submissions-provider";
import { ACTOR_APPLICATION_STATUS_LABELS } from "@/lib/application-status";
import {
  auditionStatusVariant,
  getAuditionDisplayStatus,
  isAuditionOpenForSubmission,
} from "@/lib/audition-status";
import type { Application, Audition } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

const applicationStatusVariant: Record<
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

type SubmissionRow =
  | { kind: "application"; application: Application }
  | { kind: "audition"; audition: Audition };

function displayStatusLabel(audition: Audition, submitted: boolean): string {
  if (audition.status === "accepted") return "Booked";
  if (submitted) return "Submitted";
  const displayStatus = getAuditionDisplayStatus(audition);
  if (displayStatus === "requested") return "Pending";
  if (displayStatus === "deadline passed") return "Deadline passed";
  return displayStatus;
}

function actionLabel(audition: Audition, submitted: boolean): string {
  if (submitted) return "View";
  if (isAuditionOpenForSubmission(audition)) return "Submit";
  return "View";
}

export function ActorSubmissionsContent({
  initialApplications = [],
  initialAuditions = [],
}: {
  initialApplications?: Application[];
  initialAuditions?: Audition[];
}) {
  const [query, setQuery] = useState("");
  const { isSubmitted } = useAuditionSubmissions();

  const submissionRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const activeAuditionRoleIds = new Set(
      initialAuditions
        .filter(
          (audition) =>
            audition.status === "requested" || audition.status === "submitted",
        )
        .map((audition) => audition.roleId)
        .filter(Boolean),
    );

    const applicationRows: SubmissionRow[] = initialApplications
      .filter(
        (application) =>
          application.status !== "audition_requested" ||
          !application.roleId ||
          !activeAuditionRoleIds.has(application.roleId),
      )
      .map((application) => ({
        kind: "application",
        application,
      }));

    const auditionRows: SubmissionRow[] = initialAuditions
      .filter(
        (audition) =>
          audition.status === "requested" || audition.status === "submitted",
      )
      .map((audition) => ({ kind: "audition", audition }));

    const rows = [...applicationRows, ...auditionRows];

    return rows
      .filter((row) => {
        if (!normalized) return true;
        if (row.kind === "application") {
          const application = row.application;
          return (
            application.projectTitle.toLowerCase().includes(normalized) ||
            application.roleName.toLowerCase().includes(normalized) ||
            application.productionCompany.toLowerCase().includes(normalized)
          );
        }
        const audition = row.audition;
        return (
          audition.projectTitle.toLowerCase().includes(normalized) ||
          audition.roleName.toLowerCase().includes(normalized) ||
          audition.castingDirector.toLowerCase().includes(normalized)
        );
      })
      .sort((a, b) => {
        const aDate =
          a.kind === "application"
            ? a.application.submittedAt
            : a.audition.requestedAt;
        const bDate =
          b.kind === "application"
            ? b.application.submittedAt
            : b.audition.requestedAt;
        return bDate.localeCompare(aDate);
      });
  }, [query, initialApplications, initialAuditions]);

  const pendingAuditionCount = initialAuditions
    .filter(
      (audition) =>
        audition.status === "requested" || audition.status === "submitted",
    )
    .filter((audition) => !isSubmitted(audition.id, audition.status)).length;

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Submissions
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Role applications you sent and audition requests from casting directors.
        </p>
        {pendingAuditionCount > 0 && (
          <p className="text-xs text-text-secondary mt-1">
            {pendingAuditionCount} audition request
            {pendingAuditionCount === 1 ? "" : "s"} awaiting materials
          </p>
        )}
      </div>

      <Input
        icon
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-9 text-sm"
      />

      {submissionRows.length === 0 ? (
        <Card padding="sm">
          <p className="text-sm text-text-secondary text-center py-6">
            No submissions match your search.
          </p>
        </Card>
      ) : (
        <Card padding="sm" className="overflow-hidden p-0">
          <ul className="divide-y divide-border/60">
            {submissionRows.map((row) => {
              if (row.kind === "application") {
                const application = row.application;
                return (
                  <li
                    key={`application-${application.id}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 hover:bg-bg-sidebar/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {application.projectTitle}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {application.roleName}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {application.productionCompany} · Submitted{" "}
                        {formatDateTime(application.submittedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 sm:justify-end">
                      <Badge
                        variant={
                          applicationStatusVariant[application.status] ?? "default"
                        }
                        className="text-[10px] px-2 py-0.5"
                      >
                        {ACTOR_APPLICATION_STATUS_LABELS[application.status]}
                      </Badge>
                      <Link href={`/actor/roles/${application.roleId}?from=submissions`}>
                        <Button size="sm" variant="secondary" className="h-7 text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  </li>
                );
              }

              const audition = row.audition;
              const submitted = isSubmitted(audition.id, audition.status);
              const displayStatus = submitted
                ? "submitted"
                : getAuditionDisplayStatus(audition);

              return (
                <li
                  key={`audition-${audition.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 hover:bg-bg-sidebar/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {audition.projectTitle}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {audition.roleName}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      {audition.castingDirector} · Requested{" "}
                      {formatDateTime(audition.requestedAt)} · Due{" "}
                      {formatDate(audition.deadline)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 sm:justify-end">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                      Audition request
                    </Badge>
                    <Badge
                      variant={auditionStatusVariant[displayStatus] ?? "default"}
                      className="text-[10px] px-2 py-0.5"
                    >
                      {displayStatusLabel(audition, submitted)}
                    </Badge>
                    <Link href={`/actor/auditions/${audition.id}`}>
                      <Button size="sm" variant="secondary" className="h-7 text-xs">
                        {actionLabel(audition, submitted)}
                      </Button>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
