import type { ApplicationStatus } from "@/types";

/** Status labels shown to casting directors. */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  audition_viewed: "Audition Viewed",
  reviewing: "Reviewed",
  audition_requested: "Audition Requested",
  callback: "Shortlisted",
  rejected: "Declined",
  accepted: "Booked",
};

/** Status labels shown to actors on their submissions. */
export const ACTOR_APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  ...APPLICATION_STATUS_LABELS,
  rejected: "Closed",
};

export function getApplicationStatusLabel(
  status: ApplicationStatus,
  audience: "actor" | "casting" = "casting",
): string {
  return audience === "actor"
    ? ACTOR_APPLICATION_STATUS_LABELS[status]
    : APPLICATION_STATUS_LABELS[status];
}

export const CASTING_DECLINE_ACTOR_TOOLTIP =
  "Actors will see Declined as Closed in their submissions.";

export const CASTING_COORDINATE_VIA_MESSAGE_TOOLTIP =
  "Message talent to coordinate changes after an audition request or booking offer has been sent.";

export const CASTING_DECLINE_DISABLED_AFTER_BOOKING_TOOLTIP =
  "This role has been booked. Message talent to coordinate if the role was declined.";

export const CASTING_ACTIONS_DISABLED_WHEN_ROLE_BOOKED_TOOLTIP =
  "This role has been booked. Message talent to coordinate any changes.";

/** @deprecated Use CASTING_DECLINE_ACTOR_TOOLTIP on the Decline button. */
export const CASTING_DECLINE_ACTOR_STATUS_NOTE = CASTING_DECLINE_ACTOR_TOOLTIP;

/** @deprecated Use CASTING_COORDINATE_VIA_MESSAGE_TOOLTIP on disabled action buttons. */
export const CASTING_COORDINATE_VIA_MESSAGE_NOTE = CASTING_COORDINATE_VIA_MESSAGE_TOOLTIP;
