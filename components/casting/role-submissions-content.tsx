"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PreviewImage } from "@/components/ui/preview-image";
import { AuditionRequestModal } from "@/components/casting/audition-request-modal";
import { AuditionMaterialViewer } from "@/components/casting/audition-material-viewer";
import { BookingMessageModal } from "@/components/casting/booking-message-modal";
import { CastingActorMessageModal } from "@/components/casting/casting-actor-message-modal";
import { RecommendedActorStar } from "@/components/casting/recommended-actor-star";
import { Tooltip } from "@/components/ui/tooltip";
import { useMessagesReadOptional } from "@/components/providers/messages-read-provider";
import { buildAuditionRequestTemplate } from "@/lib/audition-request-template";
import { buildBookingMessageTemplate } from "@/lib/booking-message-template";
import { buildCastingActorMessageTemplate } from "@/lib/casting-actor-message-template";
import {
  APPLICATION_STATUS_LABELS,
  CASTING_ACTIONS_DISABLED_WHEN_ROLE_BOOKED_TOOLTIP,
  CASTING_COORDINATE_VIA_MESSAGE_TOOLTIP,
  CASTING_DECLINE_ACTOR_TOOLTIP,
  CASTING_DECLINE_DISABLED_AFTER_BOOKING_TOOLTIP,
} from "@/lib/application-status";
import {
  persistApplicationStatus,
  sendActorBooking,
  shouldAutoMarkReviewed,
} from "@/lib/application-review";
import { postAuditionRequest } from "@/lib/casting-audition-requests";
import { formatAuditionInstructionsForDisplay } from "@/lib/audition-instructions-format";
import { isAuditionDeadlineInPast, resolveAuditionDeadline } from "@/lib/audition-utils";
import { buildRoleAuditionPackageFromRole } from "@/lib/role-audition-package";
import { startCastingConversation } from "@/lib/messaging-client";
import {
  canCastingMessageActorForSubmission,
  getCastingSendDisabledReason,
} from "@/lib/message-rules";
import {
  getEffectiveRoleStatus,
  subscribeRoleAcceptance,
} from "@/lib/role-acceptance-storage";
import { roleSubmissionsTag } from "@/lib/role-submissions-status";
import {
  getSubmissionRecommendationReasons,
  isRecommendedSubmissionActor,
} from "@/lib/submission-actor-recommendations";
import type { ApplicationStatus, ProjectStatus, Role, RoleSubmission, RoleSubmissionItem } from "@/types";
import { cn, formatDateTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpDown,
  FileAudio,
  FileText,
  FileVideo,
  ImageIcon,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

const statusVariant: Record<
  RoleSubmission["status"],
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

const STATUS_SORT_ORDER: Record<ApplicationStatus, number> = {
  submitted: 0,
  audition_viewed: 1,
  reviewing: 2,
  audition_requested: 3,
  callback: 4,
  accepted: 5,
  rejected: 6,
};

type StatusFilter = "all" | ApplicationStatus;
type SortKey = "submittedAt" | "status" | "actorName";

type EnrichedSubmission = RoleSubmission & {
  unionStatus: string;
  playingAge: string;
};

function itemIcon(type: RoleSubmission["items"][number]["type"]) {
  if (type === "video") return <FileVideo className="h-3.5 w-3.5" />;
  if (type === "audio") return <FileAudio className="h-3.5 w-3.5" />;
  if (type === "image") return <ImageIcon className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

function enrichSubmission(submission: RoleSubmission): EnrichedSubmission {
  return {
    ...submission,
    unionStatus: submission.unionStatus ?? "—",
    playingAge: submission.playingAge ?? "—",
  };
}

function actorProfileHref(
  projectId: string,
  roleId: string,
  submission: EnrichedSubmission,
) {
  const params = new URLSearchParams({
    projectId,
    roleId,
    submissionId: submission.id,
  });
  return `/casting/actors/${submission.actorId}?${params.toString()}`;
}

interface RoleSubmissionsContentProps {
  projectId: string;
  role: Role;
  submissions: RoleSubmission[];
  castingDirector: string;
  projectStatus: ProjectStatus;
}

export function RoleSubmissionsContent({
  projectId,
  role,
  submissions,
  castingDirector,
  projectStatus,
}: RoleSubmissionsContentProps) {
  const router = useRouter();
  const messagesRead = useMessagesReadOptional();
  const [submissionList, setSubmissionList] = useState(
    () => submissions.map(enrichSubmission),
  );
  const [selectedId, setSelectedId] = useState(submissions[0]?.id ?? "");
  const [auditionOpen, setAuditionOpen] = useState(false);
  const [auditionMessage, setAuditionMessage] = useState("");
  const [auditionDeadline, setAuditionDeadline] = useState("");
  const [auditionSending, setAuditionSending] = useState(false);
  const [auditionError, setAuditionError] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSending, setBookingSending] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [actorMessage, setActorMessage] = useState("");
  const auditionPackage = useMemo(
    () => buildRoleAuditionPackageFromRole(role),
    [role],
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [unionFilter, setUnionFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("submittedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [previewItem, setPreviewItem] = useState<RoleSubmissionItem | null>(null);

  const recommendationByActorId = useMemo(() => {
    const map = new Map<string, string[]>();
    submissionList.forEach((submission) => {
      map.set(
        submission.actorId,
        getSubmissionRecommendationReasons(submission.actorId, role.id, projectId),
      );
    });
    return map;
  }, [submissionList, role.id, projectId]);

  const unionOptions = useMemo(() => {
    const values = new Set(
      submissionList.map((submission) => submission.unionStatus).filter((v) => v !== "—"),
    );
    return Array.from(values).sort();
  }, [submissionList]);

  const filteredSubmissions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let list = submissionList.filter((submission) => {
      if (statusFilter !== "all" && submission.status !== statusFilter) return false;
      if (unionFilter !== "all" && submission.unionStatus !== unionFilter) return false;
      if (!normalized) return true;
      return (
        submission.actorName.toLowerCase().includes(normalized) ||
        submission.unionStatus.toLowerCase().includes(normalized) ||
        submission.playingAge.toLowerCase().includes(normalized)
      );
    });

    list = [...list].sort((a, b) => {
      const aRecommended = isRecommendedSubmissionActor(a.actorId, role.id, projectId);
      const bRecommended = isRecommendedSubmissionActor(b.actorId, role.id, projectId);
      if (aRecommended !== bRecommended) return aRecommended ? -1 : 1;

      if (sortKey === "submittedAt") {
        const cmp = a.submittedAt.localeCompare(b.submittedAt);
        return sortAsc ? cmp : -cmp;
      }
      if (sortKey === "status") {
        const cmp = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
        if (cmp !== 0) return sortAsc ? cmp : -cmp;
        return b.submittedAt.localeCompare(a.submittedAt);
      }
      const cmp = a.actorName.localeCompare(b.actorName);
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [submissionList, query, statusFilter, unionFilter, sortKey, sortAsc, role.id, projectId]);

  const selected = useMemo(
    () => submissionList.find((s) => s.id === selectedId),
    [submissionList, selectedId],
  );

  const roleBookedActorId = useMemo(
    () => submissionList.find((submission) => submission.status === "accepted")?.actorId ?? null,
    [submissionList],
  );
  const roleIsBooked = Boolean(roleBookedActorId);

  const canMessageSelected = selected
    ? canCastingMessageActorForSubmission({
        projectStatus,
        submissionDeadline: role.submissionDeadline,
        auditionRequested: selected.auditionRequested,
        bookingOfferSent: selected.bookingOfferSent,
      })
    : false;

  const messageDisabledReason = selected
    ? canMessageSelected
      ? null
      : getCastingSendDisabledReason({
          id: "",
          sender: "",
          preview: "",
          timestamp: "",
          unread: false,
          avatar: "",
          projectId,
          projectTitle: role.projectTitle,
          productionCompany: "",
          projectStatus,
          submissionDeadline: role.submissionDeadline,
          castingDirectorReachedOut: true,
          thread: [],
        })
    : null;

  const updateSubmissionStatus = useCallback(
    async (submissionId: string, status: ApplicationStatus) => {
      setSubmissionList((prev) =>
        prev.map((submission) =>
          submission.id === submissionId ? { ...submission, status } : submission,
        ),
      );

      try {
        const ok = await persistApplicationStatus(submissionId, status);
        if (!ok) {
          console.error("Failed to update submission status");
        }
      } catch (error) {
        console.error("Failed to update submission status:", error);
      }
    },
    [],
  );

  const markSubmissionReviewedIfNeeded = useCallback(
    (submission: EnrichedSubmission) => {
      if (!shouldAutoMarkReviewed(submission.status)) return;
      updateSubmissionStatus(submission.id, "reviewing");
    },
    [updateSubmissionStatus],
  );

  const selectSubmission = useCallback(
    (submission: EnrichedSubmission) => {
      setSelectedId(submission.id);
      setPreviewItem(null);
      markSubmissionReviewedIfNeeded(submission);
    },
    [markSubmissionReviewedIfNeeded],
  );

  const selectNextSubmission = (currentId: string) => {
    const idx = filteredSubmissions.findIndex((submission) => submission.id === currentId);
    if (idx === -1) return;
    if (idx < filteredSubmissions.length - 1) {
      setSelectedId(filteredSubmissions[idx + 1].id);
      return;
    }
    if (idx > 0) {
      setSelectedId(filteredSubmissions[idx - 1].id);
    }
  };

  const handleDecline = (submissionId: string) => {
    if (submissionList.find((s) => s.id === submissionId)?.status === "rejected") return;
    updateSubmissionStatus(submissionId, "rejected");
    selectNextSubmission(submissionId);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((value) => !value);
    else {
      setSortKey(key);
      setSortAsc(key === "actorName");
    }
  };

  const openAuditionRequest = () => {
    if (!selected || selected.auditionRequested) return;
    markSubmissionReviewedIfNeeded(selected);
    setAuditionError(null);
    setAuditionMessage(
      buildAuditionRequestTemplate({
        actorName: selected.actorName,
        characterName: role.characterName,
        projectTitle: role.projectTitle,
        castingDirector,
        auditionPackage,
      }),
    );
    setAuditionDeadline(resolveAuditionDeadline(role.submissionDeadline));
    setAuditionOpen(true);
  };

  const sendAuditionRequest = async () => {
    if (!selected || auditionSending) return;
    if (auditionDeadline && isAuditionDeadlineInPast(auditionDeadline)) {
      setAuditionError("Audition deadline cannot be in the past.");
      return;
    }
    setAuditionSending(true);
    setAuditionError(null);

    const result = await postAuditionRequest({
      roleId: role.id,
      actorId: selected.actorId,
      deadline: auditionDeadline || undefined,
      instructions:
        formatAuditionInstructionsForDisplay(auditionMessage.trim()) ||
        auditionPackage.instructions,
      uploadRequirements: auditionPackage.uploadRequirements,
    });

    if (!result.ok) {
      setAuditionError(result.error ?? "Failed to send audition request.");
      setAuditionSending(false);
      return;
    }

    updateSubmissionStatus(selected.id, "audition_requested");
    setSubmissionList((prev) =>
      prev.map((submission) =>
        submission.id === selected.id
          ? { ...submission, auditionRequested: true, status: "audition_requested" }
          : submission,
      ),
    );
    setAuditionSending(false);
    setAuditionOpen(false);
  };

  const openActorMessage = () => {
    if (!selected) return;
    markSubmissionReviewedIfNeeded(selected);
    setActorMessage(
      buildCastingActorMessageTemplate({
        actorName: selected.actorName,
        roleName: role.characterName,
        projectTitle: role.projectTitle,
        castingDirector,
      }),
    );
    setMessageOpen(true);
  };

  const sendActorMessage = async () => {
    if (!selected || !actorMessage.trim() || !canMessageSelected) return;

    const result = await startCastingConversation({
      projectId,
      actorId: selected.actorId,
      body: actorMessage,
    });

    if (!result.ok) {
      console.error(result.error ?? "Failed to send message");
      return;
    }

    if (result.conversation) {
      messagesRead?.upsertConversation(result.conversation);
      setMessageOpen(false);
      router.push(`/casting/messages?conversation=${result.conversation.id}`);
    }
  };

  const openBookingMessage = () => {
    if (!selected || selected.bookingOfferSent) return;
    markSubmissionReviewedIfNeeded(selected);
    setBookingError(null);
    setBookingMessage(
      buildBookingMessageTemplate({
        actorName: selected.actorName,
        characterName: role.characterName,
        projectTitle: role.projectTitle,
        castingDirector,
        shootDates: role.shootDates,
      }),
    );
    setBookingOpen(true);
  };

  const sendBookingMessage = async () => {
    if (!selected || !bookingMessage.trim() || bookingSending) return;
    setBookingSending(true);
    setBookingError(null);
    const result = await sendActorBooking({
      applicationId: selected.id,
      message: bookingMessage.trim(),
    });
    if (!result.ok) {
      setBookingError(result.error ?? "Failed to book actor.");
      setBookingSending(false);
      return;
    }
    updateSubmissionStatus(selected.id, "accepted");
    setSubmissionList((prev) =>
      prev.map((submission) =>
        submission.id === selected.id
          ? { ...submission, bookingOfferSent: true, status: "accepted" }
          : submission,
      ),
    );
    setBookingOpen(false);
    setBookingSending(false);
  };

  const effectiveRoleStatus = useSyncExternalStore(
    subscribeRoleAcceptance,
    () => getEffectiveRoleStatus(role.id, role.status),
    () => role.status,
  );
  const submissionsTag = roleSubmissionsTag(effectiveRoleStatus);

  const statusFilters: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "submitted", label: APPLICATION_STATUS_LABELS.submitted },
    { id: "reviewing", label: APPLICATION_STATUS_LABELS.reviewing },
    { id: "audition_requested", label: APPLICATION_STATUS_LABELS.audition_requested },
    { id: "callback", label: APPLICATION_STATUS_LABELS.callback },
    { id: "accepted", label: APPLICATION_STATUS_LABELS.accepted },
    { id: "rejected", label: APPLICATION_STATUS_LABELS.rejected },
  ];

  return (
    <div className="space-y-4 animate-fade-in max-w-6xl">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {role.projectTitle}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {role.characterName}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <p className="text-sm text-text-secondary">
            {role.projectTitle} · {role.roleType} · {submissionList.length} submissions
          </p>
          <Badge variant={submissionsTag.variant} className="text-[10px] px-2 py-0.5">
            {submissionsTag.label}
          </Badge>
        </div>
      </div>

      <Card padding="sm">
        <div className="flex flex-col gap-3 mb-3">
          <Input
            icon
            placeholder="Search by name, union, or playing age..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
              Status
            </span>
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  statusFilter === filter.id
                    ? "bg-text-primary text-white border-text-primary"
                    : "border-border text-text-secondary hover:text-text-primary",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {unionOptions.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                Union
              </span>
              <button
                type="button"
                onClick={() => setUnionFilter("all")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  unionFilter === "all"
                    ? "bg-text-primary text-white border-text-primary"
                    : "border-border text-text-secondary hover:text-text-primary",
                )}
              >
                All
              </button>
              {unionOptions.map((union) => (
                <button
                  key={union}
                  type="button"
                  onClick={() => setUnionFilter(union)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    unionFilter === union
                      ? "bg-text-primary text-white border-text-primary"
                      : "border-border text-text-secondary hover:text-text-primary",
                  )}
                >
                  {union}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredSubmissions.length === 0 ? (
          <p className="text-xs text-text-secondary py-6 text-center">
            No submissions match your search or filters.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="border-b border-border/60 text-left text-[9px] font-semibold text-text-secondary uppercase tracking-wide">
                  <th className="py-2 pr-4 min-w-[180px]">
                    <button
                      type="button"
                      onClick={() => toggleSort("actorName")}
                      className="flex items-center gap-1 hover:text-text-primary"
                    >
                      Actor <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-2 px-3 min-w-[90px]">Playing age</th>
                  <th className="py-2 px-3 min-w-[100px]">Union</th>
                  <th className="py-2 px-3 min-w-[100px]">
                    <button
                      type="button"
                      onClick={() => toggleSort("submittedAt")}
                      className="flex items-center gap-1 hover:text-text-primary"
                    >
                      Submitted <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-2 px-3 min-w-[100px]">
                    <button
                      type="button"
                      onClick={() => toggleSort("status")}
                      className="flex items-center gap-1 hover:text-text-primary"
                    >
                      Status <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => {
                  const isSelected = submission.id === selectedId;
                  const recommendationReasons =
                    recommendationByActorId.get(submission.actorId) ?? [];
                  const recommended = recommendationReasons.length > 0;
                  return (
                    <tr
                      key={submission.id}
                      onClick={() => selectSubmission(submission)}
                      className={cn(
                        "border-b border-border/40 cursor-pointer transition-colors",
                        isSelected ? "bg-bg-sidebar/70" : "hover:bg-bg-sidebar/40",
                      )}
                    >
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            initials={submission.actorInitials}
                            imageUrl={submission.actorPhotoUrl}
                            size="sm"
                          />
                          <div className="min-w-0 flex items-center gap-1.5">
                            {recommended && (
                              <RecommendedActorStar reasons={recommendationReasons} />
                            )}
                            <Link
                              href={actorProfileHref(projectId, role.id, submission)}
                              onClick={(e) => {
                                e.stopPropagation();
                                markSubmissionReviewedIfNeeded(submission);
                              }}
                              className="text-sm font-medium text-text-primary hover:text-accent truncate"
                            >
                              {submission.actorName}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">
                        {submission.playingAge}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                          {submission.unionStatus}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary whitespace-nowrap">
                        {formatDateTime(submission.submittedAt)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={statusVariant[submission.status]}
                          className="text-[10px] px-2 py-0.5"
                        >
                          {APPLICATION_STATUS_LABELS[submission.status]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="min-w-0">
        {selected ? (
          <>
            <Card padding="sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    initials={selected.actorInitials}
                    imageUrl={selected.actorPhotoUrl}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {isRecommendedSubmissionActor(
                        selected.actorId,
                        role.id,
                        projectId,
                      ) && (
                        <RecommendedActorStar
                          reasons={recommendationByActorId.get(selected.actorId)}
                        />
                      )}
                      <Link
                        href={actorProfileHref(projectId, role.id, selected)}
                        onClick={() => markSubmissionReviewedIfNeeded(selected)}
                        className="text-sm font-semibold text-text-primary hover:text-accent"
                      >
                        {selected.actorName}
                      </Link>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        {selected.unionStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {selected.playingAge} · Submitted {formatDateTime(selected.submittedAt)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={statusVariant[selected.status]}
                  className="text-[10px] px-2 py-0.5 shrink-0"
                >
                  {APPLICATION_STATUS_LABELS[selected.status]}
                </Badge>
              </div>

              {selected.note && (
                <p className="text-xs text-text-secondary mb-3 border-l-2 border-accent/40 pl-3">
                  {selected.note}
                </p>
              )}

              <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Uploaded materials
              </p>

              {previewItem && (
                <AuditionMaterialViewer
                  auditionId={selected.id}
                  label={previewItem.label}
                  fileName={previewItem.fileName}
                  fileUrl={previewItem.fileUrl}
                  onClose={() => setPreviewItem(null)}
                  className="mb-3"
                />
              )}

              <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
                {selected.items.map((item) => {
                  const isPreviewing =
                    previewItem?.label === item.label &&
                    previewItem?.fileName === item.fileName;

                  return (
                    <li
                      key={`${item.label}-${item.fileName}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 transition-colors",
                        isPreviewing ? "bg-bg-sidebar/70" : "hover:bg-bg-sidebar/40",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-sidebar text-text-secondary overflow-hidden">
                          {item.type === "image" && item.fileUrl ? (
                            <PreviewImage
                              src={item.fileUrl}
                              alt={item.label}
                              width={40}
                              height={40}
                              className="h-10 w-10 object-cover"
                            />
                          ) : (
                            itemIcon(item.type)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-primary">{item.label}</p>
                          <p className="text-xs text-text-secondary truncate">{item.fileName}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 pt-3 border-t border-border/60 space-y-3">
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  Actions
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={actorProfileHref(projectId, role.id, selected)}
                    onClick={() => markSubmissionReviewedIfNeeded(selected)}
                  >
                    <Button type="button" variant="secondary" size="sm" className="h-8 text-xs">
                      View profile
                    </Button>
                  </Link>
                  {(() => {
                    const reviewedDisabled =
                      selected.status === "reviewing" || roleIsBooked;
                    const reviewedButton = (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={reviewedDisabled}
                        onClick={() => updateSubmissionStatus(selected.id, "reviewing")}
                      >
                        Reviewed
                      </Button>
                    );

                    return roleIsBooked ? (
                      <Tooltip
                        content={CASTING_ACTIONS_DISABLED_WHEN_ROLE_BOOKED_TOOLTIP}
                        side="top"
                      >
                        <span className="inline-flex">{reviewedButton}</span>
                      </Tooltip>
                    ) : (
                      reviewedButton
                    );
                  })()}
                  {(() => {
                    const shortlistDisabled =
                      selected.status === "callback" || roleIsBooked;
                    const shortlistButton = (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={shortlistDisabled}
                        onClick={() => updateSubmissionStatus(selected.id, "callback")}
                      >
                        Shortlist
                      </Button>
                    );

                    return roleIsBooked ? (
                      <Tooltip
                        content={CASTING_ACTIONS_DISABLED_WHEN_ROLE_BOOKED_TOOLTIP}
                        side="top"
                      >
                        <span className="inline-flex">{shortlistButton}</span>
                      </Tooltip>
                    ) : (
                      shortlistButton
                    );
                  })()}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={!canMessageSelected}
                    onClick={openActorMessage}
                  >
                    Message
                  </Button>
                  {(() => {
                    const bookingOfferAlreadySent =
                      selected.bookingOfferSent || selected.status === "accepted";
                    const bookDisabled = bookingOfferAlreadySent || roleIsBooked;
                    const bookButton = (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={bookDisabled}
                        onClick={openBookingMessage}
                      >
                        {bookingOfferAlreadySent ? "Booking sent" : "Book"}
                      </Button>
                    );

                    if (roleIsBooked) {
                      return (
                        <Tooltip
                          content={CASTING_ACTIONS_DISABLED_WHEN_ROLE_BOOKED_TOOLTIP}
                          side="top"
                        >
                          <span className="inline-flex">{bookButton}</span>
                        </Tooltip>
                      );
                    }

                    return bookingOfferAlreadySent ? (
                      <Tooltip content={CASTING_COORDINATE_VIA_MESSAGE_TOOLTIP} side="top">
                        <span className="inline-flex">{bookButton}</span>
                      </Tooltip>
                    ) : (
                      bookButton
                    );
                  })()}
                  <Tooltip
                    content={
                      roleBookedActorId
                        ? CASTING_DECLINE_DISABLED_AFTER_BOOKING_TOOLTIP
                        : CASTING_DECLINE_ACTOR_TOOLTIP
                    }
                    side="top"
                  >
                    <span className="inline-flex">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={
                          selected.status === "rejected" || Boolean(roleBookedActorId)
                        }
                        onClick={() => handleDecline(selected.id)}
                      >
                        Decline
                      </Button>
                    </span>
                  </Tooltip>
                  {selected.auditionRequested ? (
                    <Tooltip content={CASTING_COORDINATE_VIA_MESSAGE_TOOLTIP} side="top">
                      <span className="inline-flex">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={openAuditionRequest}
                          disabled
                          variant="secondary"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Audition requested
                        </Button>
                      </span>
                    </Tooltip>
                  ) : roleIsBooked ? (
                    <Tooltip
                      content={CASTING_ACTIONS_DISABLED_WHEN_ROLE_BOOKED_TOOLTIP}
                      side="top"
                    >
                      <span className="inline-flex">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={openAuditionRequest}
                          disabled
                          variant="primary"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send audition
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={openAuditionRequest}
                      variant="primary"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send audition
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {auditionOpen && selected && (
              <AuditionRequestModal
                actorName={selected.actorName}
                auditionPackage={auditionPackage}
                message={auditionMessage}
                deadline={auditionDeadline}
                onMessageChange={setAuditionMessage}
                onDeadlineChange={setAuditionDeadline}
                onSend={sendAuditionRequest}
                onClose={() => {
                  if (auditionSending) return;
                  setAuditionOpen(false);
                  setAuditionError(null);
                }}
                sending={auditionSending}
                error={auditionError}
              />
            )}

            {bookingOpen && selected && (
              <BookingMessageModal
                actorName={selected.actorName}
                characterName={role.characterName}
                projectTitle={role.projectTitle}
                message={bookingMessage}
                onMessageChange={setBookingMessage}
                onSend={sendBookingMessage}
                onClose={() => {
                  if (bookingSending) return;
                  setBookingOpen(false);
                  setBookingError(null);
                }}
                sending={bookingSending}
                error={bookingError}
              />
            )}

            {messageOpen && selected && (
              <CastingActorMessageModal
                actorName={selected.actorName}
                roleName={role.characterName}
                projectTitle={role.projectTitle}
                submissionDeadline={role.submissionDeadline}
                message={actorMessage}
                onMessageChange={setActorMessage}
                onSend={sendActorMessage}
                onClose={() => setMessageOpen(false)}
                disabled={!canMessageSelected}
                disabledReason={messageDisabledReason}
              />
            )}
          </>
        ) : (
          <Card padding="sm">
            <p className="text-sm text-text-secondary text-center py-8">
              Select a submission to review materials.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
