"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CastingAuditionSubmissionModal } from "@/components/casting/casting-audition-submission-modal";
import {
  buildInitialSubmissionsState,
  buildServerSubmissionsState,
} from "@/lib/audition-submission-storage";
import { APPLICATION_STATUS_LABELS } from "@/lib/application-status";
import {
  persistAuditionReviewStatus,
} from "@/lib/application-review";
import {
  buildInitialCastingAuditionReviews,
  writeStoredCastingAuditionReviews,
} from "@/lib/casting-audition-review-storage";
import {
  buildCastingAuditionSubmissionRows,
} from "@/lib/casting-audition-submissions";
import {
  buildInitialViewedSubmissionIds,
  markSubmissionViewed,
} from "@/lib/casting-submission-viewed-storage";
import { createClientStoreSnapshot } from "@/lib/client-store-snapshot";
import { emitClientStoreChange } from "@/lib/client-store-subscribe";
import type { ApplicationStatus, Audition } from "@/types";
import type { CastingAuditionSubmissionRow } from "@/lib/casting-audition-submissions";
import { cn, formatDateTime } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

const statusVariant: Record<
  ApplicationStatus,
  "default" | "info" | "accent" | "success" | "warning" | "danger"
> = {
  submitted: "default",
  audition_viewed: "info",
  reviewing: "info",
  audition_requested: "accent",
  callback: "accent",
  accepted: "success",
  rejected: "danger",
};

const reviewsStore = createClientStoreSnapshot({
  buildServerSnapshot: () => ({}),
  buildClientSnapshot: () => buildInitialCastingAuditionReviews(),
});

const viewedStore = createClientStoreSnapshot({
  buildServerSnapshot: () => new Set<string>(),
  buildClientSnapshot: () => buildInitialViewedSubmissionIds(),
});

const selectClass =
  "h-9 rounded-xl border border-border bg-bg-primary px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 min-w-[180px] max-w-xs";

function SubmissionTable({
  rows,
  selectedAuditionId,
  onSelect,
  emptyMessage,
}: {
  rows: CastingAuditionSubmissionRow[];
  selectedAuditionId: string | null;
  onSelect: (auditionId: string) => void;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-text-secondary text-center py-6">{emptyMessage}</p>
    ) : null;
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full min-w-[560px] text-xs">
        <thead>
          <tr className="border-b border-border/60 text-left text-[9px] font-semibold text-text-secondary uppercase tracking-wide">
            <th className="py-2 pr-4 min-w-[180px]">Actor</th>
            <th className="py-2 px-3 min-w-[140px]">Role</th>
            <th className="py-2 px-3 min-w-[120px]">Submitted</th>
            <th className="py-2 px-3 min-w-[100px]">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.auditionId}
              onClick={() => onSelect(row.auditionId)}
              className={cn(
                "border-b border-border/40 cursor-pointer transition-colors",
                selectedAuditionId === row.auditionId
                  ? "bg-bg-sidebar/70"
                  : "hover:bg-bg-sidebar/40",
              )}
            >
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    initials={row.actorInitials}
                    imageUrl={row.actorPhotoUrl}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-text-primary truncate">
                    {row.actorName}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-text-primary">
                <span className="block truncate">{row.roleName}</span>
                <span className="block text-[10px] text-text-secondary truncate mt-0.5">
                  {row.projectTitle}
                </span>
              </td>
              <td className="py-2.5 px-3 text-text-secondary whitespace-nowrap">
                {formatDateTime(row.submittedAt)}
              </td>
              <td className="py-2.5 px-3">
                <Badge
                  variant={statusVariant[row.status]}
                  className="text-[10px] px-2 py-0.5"
                >
                  {APPLICATION_STATUS_LABELS[row.status]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CastingSubmissionsContent({
  initialAuditions = [],
  bookedActorsByRole: initialBookedActorsByRole = {},
  bookingOfferSentKeys: initialBookingOfferSentKeys = new Set<string>(),
}: {
  initialAuditions?: Audition[];
  bookedActorsByRole?: Record<string, string>;
  bookingOfferSentKeys?: Set<string>;
}) {
  const [bookedActorsByRole, setBookedActorsByRole] = useState(initialBookedActorsByRole);
  const bookingOfferSentKeys = initialBookingOfferSentKeys;
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedAuditionId, setSelectedAuditionId] = useState<string | null>(null);
  const [viewedOpen, setViewedOpen] = useState(false);

  const auditionSubmissionsStore = useMemo(
    () =>
      createClientStoreSnapshot({
        buildServerSnapshot: () => buildServerSubmissionsState(initialAuditions),
        buildClientSnapshot: () => buildInitialSubmissionsState(initialAuditions),
      }),
    [initialAuditions],
  );

  const submissions = useSyncExternalStore(
    auditionSubmissionsStore.subscribe,
    auditionSubmissionsStore.getSnapshot,
    auditionSubmissionsStore.getServerSnapshot,
  );

  const reviews = useSyncExternalStore(
    reviewsStore.subscribe,
    reviewsStore.getSnapshot,
    reviewsStore.getServerSnapshot,
  );

  const viewedIds = useSyncExternalStore(
    viewedStore.subscribe,
    viewedStore.getSnapshot,
    viewedStore.getServerSnapshot,
  );

  const rows = useMemo(
    () =>
      buildCastingAuditionSubmissionRows(
        initialAuditions,
        submissions,
        reviews,
        bookedActorsByRole,
        bookingOfferSentKeys,
      ),
    [initialAuditions, submissions, reviews, bookedActorsByRole, bookingOfferSentKeys],
  );

  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => map.set(row.projectId, row.projectTitle));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (projectFilter !== "all" && row.projectId !== projectFilter) return false;
      if (!normalized) return true;
      return (
        row.actorName.toLowerCase().includes(normalized) ||
        row.roleName.toLowerCase().includes(normalized) ||
        row.projectTitle.toLowerCase().includes(normalized)
      );
    });
  }, [rows, query, projectFilter]);

  const newRows = useMemo(
    () => filteredRows.filter((row) => !viewedIds.has(row.auditionId)),
    [filteredRows, viewedIds],
  );

  const viewedRows = useMemo(
    () => filteredRows.filter((row) => viewedIds.has(row.auditionId)),
    [filteredRows, viewedIds],
  );

  const selectedRow = useMemo(
    () => rows.find((row) => row.auditionId === selectedAuditionId),
    [rows, selectedAuditionId],
  );

  const updateReviewStatus = useCallback(
    (auditionId: string, status: ApplicationStatus) => {
      const next = { ...buildInitialCastingAuditionReviews(), ...reviews, [auditionId]: status };
      writeStoredCastingAuditionReviews(next);
      emitClientStoreChange();
    },
    [reviews],
  );

  const markViewed = useCallback(
    (auditionId: string) => {
      if (!viewedIds.has(auditionId)) {
        markSubmissionViewed(auditionId);
        emitClientStoreChange();
      }
    },
    [viewedIds],
  );

  const openSubmission = useCallback(
    (auditionId: string) => {
      setSelectedAuditionId(auditionId);
      markViewed(auditionId);

      const row = rows.find((r) => r.auditionId === auditionId);
      if (
        row &&
        row.status !== "callback" &&
        row.status !== "accepted" &&
        row.status !== "rejected"
      ) {
        updateReviewStatus(auditionId, "reviewing");
        void persistAuditionReviewStatus(auditionId, "reviewing");
      }
    },
    [markViewed, rows, updateReviewStatus],
  );

  const selectNextRow = useCallback(
    (currentId: string) => {
      const idx = newRows.findIndex((row) => row.auditionId === currentId);
      if (idx === -1) {
        setSelectedAuditionId(null);
        return;
      }
      if (idx < newRows.length - 1) {
        openSubmission(newRows[idx + 1].auditionId);
        return;
      }
      if (idx > 0) {
        openSubmission(newRows[idx - 1].auditionId);
        return;
      }
      setSelectedAuditionId(null);
    },
    [newRows, openSubmission],
  );

  const handleDecline = useCallback(
    (auditionId: string) => {
      const row = rows.find((r) => r.auditionId === auditionId);
      if (row?.status === "rejected") return;
      void persistAuditionReviewStatus(auditionId, "rejected").then((ok) => {
        if (!ok) return;
        updateReviewStatus(auditionId, "rejected");
        if (row?.roleId && bookedActorsByRole[row.roleId] === row.actorId) {
          setBookedActorsByRole((prev) => {
            const next = { ...prev };
            delete next[row.roleId!];
            return next;
          });
        }
        selectNextRow(auditionId);
      });
    },
    [rows, updateReviewStatus, selectNextRow, bookedActorsByRole],
  );

  const handleStatusChange = useCallback(
    (auditionId: string, status: ApplicationStatus) => {
      if (status === "accepted") {
        const row = rows.find((r) => r.auditionId === auditionId);
        if (row?.roleId) {
          setBookedActorsByRole((prev) => ({
            ...prev,
            [row.roleId!]: row.actorId,
          }));
        }
        updateReviewStatus(auditionId, status);
        return;
      }
      void persistAuditionReviewStatus(auditionId, status).then((ok) => {
        if (!ok) return;
        updateReviewStatus(auditionId, status);
      });
    },
    [rows, updateReviewStatus],
  );

  const handleCloseModal = useCallback(() => {
    setSelectedAuditionId(null);
  }, []);

  const hasAnyRows = filteredRows.length > 0;

  return (
    <div className="space-y-4 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Review Auditions
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Review audition materials submitted by actors.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          icon
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 text-sm flex-1"
        />
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className={selectClass}
          aria-label="Filter by project"
        >
          <option value="all">All projects</option>
          {projectOptions.map(([projectId, projectTitle]) => (
            <option key={projectId} value={projectId}>
              {projectTitle}
            </option>
          ))}
        </select>
      </div>

      {!hasAnyRows ? (
        <Card padding="sm">
          <p className="text-sm text-text-secondary text-center py-8">
            No submitted auditions match your filters.
          </p>
        </Card>
      ) : (
        <>
          <Card padding="sm">
            <p className="text-xs font-semibold text-text-primary mb-1">New</p>
            <p className="text-xs text-text-secondary mb-3">
              {newRows.length} submission{newRows.length === 1 ? "" : "s"} to review
            </p>
            <SubmissionTable
              rows={newRows}
              selectedAuditionId={selectedAuditionId}
              onSelect={openSubmission}
              emptyMessage="No new submissions match your filters."
            />
          </Card>

          {viewedRows.length > 0 && (
            <Card padding="sm">
              <button
                type="button"
                onClick={() => setViewedOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-3 text-left"
                aria-expanded={viewedOpen}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-text-primary">Viewed</span>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                    {viewedRows.length}
                  </Badge>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-text-secondary shrink-0 transition-transform duration-200",
                    viewedOpen && "rotate-180",
                  )}
                />
              </button>

              {viewedOpen && (
                <div className="mt-3 animate-fade-in border-t border-border/60 pt-3">
                  <SubmissionTable
                    rows={viewedRows}
                    selectedAuditionId={selectedAuditionId}
                    onSelect={openSubmission}
                  />
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {selectedRow && (
        <CastingAuditionSubmissionModal
          row={selectedRow}
          onClose={handleCloseModal}
          onStatusChange={handleStatusChange}
          onDecline={handleDecline}
        />
      )}
    </div>
  );
}
