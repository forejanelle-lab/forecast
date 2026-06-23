"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PreviewImage } from "@/components/ui/preview-image";
import { Tooltip } from "@/components/ui/tooltip";
import {
  AuditionMaterialViewer,
  downloadAuditionMaterial,
} from "@/components/casting/audition-material-viewer";
import { BookingMessageModal } from "@/components/casting/booking-message-modal";
import { CastingActorMessageModal } from "@/components/casting/casting-actor-message-modal";
import { useMessagesReadOptional } from "@/components/providers/messages-read-provider";
import { useCastingProfileOptional } from "@/components/providers/casting-profile-provider";
import {
  APPLICATION_STATUS_LABELS,
  CASTING_ACTIONS_DISABLED_WHEN_ROLE_BOOKED_TOOLTIP,
  CASTING_COORDINATE_VIA_MESSAGE_TOOLTIP,
  CASTING_DECLINE_ACTOR_TOOLTIP,
  CASTING_DECLINE_DISABLED_AFTER_BOOKING_TOOLTIP,
} from "@/lib/application-status";
import { shouldAutoMarkReviewed, sendActorBooking } from "@/lib/application-review";
import { buildCastingActorMessageTemplate } from "@/lib/casting-actor-message-template";
import { startCastingConversation } from "@/lib/messaging-client";
import { buildBookingMessageTemplate } from "@/lib/booking-message-template";
import { getCastingSendDisabledReason, canCastingMessageActorForSubmission } from "@/lib/message-rules";
import type { CastingAuditionSubmissionRow } from "@/lib/casting-audition-submissions";
import { getMediaFileKind } from "@/lib/media-file-kind";
import type { ApplicationStatus, AuditionSubmissionItem } from "@/types";
import { cn, formatDateTime } from "@/lib/utils";
import {
  Download,
  FileAudio,
  FileText,
  FileVideo,
  ImageIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/lib/use-mounted";

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

function itemIcon(fileName: string) {
  const kind = getMediaFileKind(fileName);
  if (kind === "video") return <FileVideo className="h-3.5 w-3.5" />;
  if (kind === "image") return <ImageIcon className="h-3.5 w-3.5" />;
  if (kind === "audio") return <FileAudio className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

function actorProfileHref(row: CastingAuditionSubmissionRow) {
  const params = new URLSearchParams({ projectId: row.projectId });
  if (row.roleId) params.set("roleId", row.roleId);
  return `/casting/actors/${row.actorId}?${params.toString()}`;
}

interface CastingAuditionSubmissionModalProps {
  row: CastingAuditionSubmissionRow;
  onClose: () => void;
  onStatusChange: (auditionId: string, status: ApplicationStatus) => void;
  onDecline: (auditionId: string) => void;
}

export function CastingAuditionSubmissionModal({
  row,
  onClose,
  onStatusChange,
  onDecline,
}: CastingAuditionSubmissionModalProps) {
  const mounted = useMounted();
  const router = useRouter();
  const messagesRead = useMessagesReadOptional();
  const castingProfile = useCastingProfileOptional();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSending, setBookingSending] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingOfferSent, setBookingOfferSent] = useState(row.bookingOfferSent ?? false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [actorMessage, setActorMessage] = useState("");
  const [previewItem, setPreviewItem] = useState<AuditionSubmissionItem | null>(null);

  const projectStatus = row.projectStatus ?? "active";
  const submissionDeadline = row.submissionDeadline ?? "";
  const roleIsBooked = Boolean(row.roleBookedActorId);
  const castingDirector =
    castingProfile?.displayName ?? row.castingDirector ?? "Casting Director";
  const canMessageActor = canCastingMessageActorForSubmission({
    projectStatus,
    submissionDeadline,
    auditionRequested: true,
    bookingOfferSent,
  });
  const messageDisabledReason = canMessageActor
    ? null
    : getCastingSendDisabledReason({
    id: "",
    sender: "",
    preview: "",
    timestamp: "",
    unread: false,
    avatar: "",
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    productionCompany: "",
    projectStatus,
    submissionDeadline,
    castingDirectorReachedOut: true,
    thread: [],
  });

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || bookingOpen || messageOpen) return;
      if (previewItem) {
        setPreviewItem(null);
        return;
      }
      handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose, bookingOpen, messageOpen, previewItem]);

  const markReviewedIfNeeded = useCallback(() => {
    if (shouldAutoMarkReviewed(row.status)) {
      onStatusChange(row.auditionId, "reviewing");
    }
  }, [row.auditionId, row.status, onStatusChange]);

  const openActorMessage = () => {
    markReviewedIfNeeded();
    setActorMessage(
      buildCastingActorMessageTemplate({
        actorName: row.actorName,
        roleName: row.roleName,
        projectTitle: row.projectTitle,
        castingDirector,
      }),
    );
    setMessageOpen(true);
  };

  const sendActorMessage = async () => {
    if (!actorMessage.trim() || !canMessageActor) return;

    const result = await startCastingConversation({
      projectId: row.projectId,
      actorId: row.actorId,
      body: actorMessage,
    });

    if (!result.ok) {
      console.error(result.error ?? "Failed to send message");
      return;
    }

    if (result.conversation) {
      messagesRead?.upsertConversation(result.conversation);
      setMessageOpen(false);
      handleClose();
      router.push(`/casting/messages?conversation=${result.conversation.id}`);
      return;
    }

    setMessageOpen(false);
  };

  const openBookingMessage = () => {
    if (bookingOfferSent) return;
    markReviewedIfNeeded();
    setBookingError(null);
    setBookingMessage(
      buildBookingMessageTemplate({
        actorName: row.actorName,
        characterName: row.roleName,
        projectTitle: row.projectTitle,
        castingDirector,
        shootDates: row.shootDates ?? "",
      }),
    );
    setBookingOpen(true);
  };

  const sendBookingMessage = async () => {
    if (!bookingMessage.trim() || bookingSending) return;
    setBookingSending(true);
    setBookingError(null);
    const result = await sendActorBooking({
      auditionId: row.auditionId,
      message: bookingMessage.trim(),
    });
    if (!result.ok) {
      setBookingError(result.error ?? "Failed to book actor.");
      setBookingSending(false);
      return;
    }
    setBookingOfferSent(true);
    onStatusChange(row.auditionId, "accepted");
    setBookingOpen(false);
    setBookingSending(false);
    handleClose();
  };

  const handleDownload = (item: AuditionSubmissionItem) => {
    downloadAuditionMaterial(row.auditionId, item.label, item.fileName, item.fileUrl);
  };

  if (!mounted) return null;

  const nestedModalOpen = messageOpen || bookingOpen;

  return createPortal(
    <>
      {!nestedModalOpen && (
      <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain">
        <button
          type="button"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
          aria-label="Close"
        />
        <div className="relative flex min-h-full items-start justify-center p-4 sm:p-6">
          <div
            className="relative flex w-full max-w-3xl max-h-[calc(100dvh-2rem)] my-4 sm:my-8 flex-col rounded-[20px] bg-bg-secondary border border-border/60 shadow-[var(--shadow-card)] animate-fade-in overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audition-submission-title"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 px-6 py-5 border-b border-border/60">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  initials={row.actorInitials}
                  imageUrl={row.actorPhotoUrl}
                  size="md"
                />
                <div className="min-w-0">
                  <h2
                    id="audition-submission-title"
                    className="text-base font-semibold text-text-primary truncate"
                  >
                    {row.actorName}
                  </h2>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {row.projectTitle}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {row.roleName} · Submitted {formatDateTime(row.submittedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={statusVariant[row.status]}
                  className="text-[10px] px-2 py-0.5"
                >
                  {APPLICATION_STATUS_LABELS[row.status]}
                </Badge>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
              {previewItem && (
                <AuditionMaterialViewer
                  auditionId={row.auditionId}
                  label={previewItem.label}
                  fileName={previewItem.fileName}
                  fileUrl={previewItem.fileUrl}
                  onClose={() => setPreviewItem(null)}
                />
              )}

              <div>
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Audition materials
                </p>
                <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
                  {row.items.map((item) => {
                    const isPreviewing =
                      previewItem?.label === item.label &&
                      previewItem?.fileName === item.fileName;
                    const kind = getMediaFileKind(item.fileName);

                    return (
                      <li key={`${item.label}-${item.fileName}`}>
                        <div
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
                              {kind === "image" && item.fileUrl ? (
                                <PreviewImage
                                  src={item.fileUrl}
                                  alt={item.label}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 object-cover"
                                />
                              ) : (
                                itemIcon(item.fileName)
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-text-primary">
                                {item.label}
                              </p>
                              <p className="text-xs text-text-secondary truncate">
                                {item.fileName}
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(item)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors"
                            aria-label={`Download ${item.label}`}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-bg-primary/50 space-y-3">
              <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                Actions
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={actorProfileHref(row)}
                  onClick={() => markReviewedIfNeeded()}
                >
                  <Button type="button" variant="secondary" size="sm" className="h-8 text-xs">
                    View profile
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={!canMessageActor}
                  onClick={openActorMessage}
                >
                  Message
                </Button>
                {(() => {
                  const shortlistDisabled = row.status === "callback" || roleIsBooked;
                  const shortlistButton = (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={shortlistDisabled}
                      onClick={() => {
                        markReviewedIfNeeded();
                        onStatusChange(row.auditionId, "callback");
                      }}
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
                {(() => {
                  const bookingOfferAlreadySent =
                    bookingOfferSent || row.status === "accepted";
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
                    row.roleBookedActorId
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
                        row.status === "rejected" || Boolean(row.roleBookedActorId)
                      }
                      onClick={() => onDecline(row.auditionId)}
                    >
                      Decline
                    </Button>
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {bookingOpen && (
        <BookingMessageModal
          actorName={row.actorName}
          characterName={row.roleName}
          projectTitle={row.projectTitle}
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

      {messageOpen && (
        <CastingActorMessageModal
          actorName={row.actorName}
          roleName={row.roleName}
          projectTitle={row.projectTitle}
          submissionDeadline={submissionDeadline}
          message={actorMessage}
          onMessageChange={setActorMessage}
          onSend={sendActorMessage}
          onClose={() => setMessageOpen(false)}
          disabled={!canMessageActor}
          disabledReason={messageDisabledReason}
        />
      )}
    </>,
    document.body,
  );
}
