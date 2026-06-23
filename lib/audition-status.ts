import { isUpcomingAudition } from "@/lib/audition-utils";
import type { Audition, AuditionStatus } from "@/types";

export type AuditionDisplayStatus = AuditionStatus | "deadline passed";

export function isAuditionDeadlinePassed(deadline: string): boolean {
  return !isUpcomingAudition(deadline);
}

export function getAuditionDisplayStatus(audition: Audition): AuditionDisplayStatus {
  if (audition.status === "accepted") return "accepted";
  if (audition.status === "submitted") return "submitted";
  if (audition.status === "declined") return "declined";
  if (audition.status === "withdrawn") return "withdrawn";
  if (
    audition.status === "requested" &&
    isAuditionDeadlinePassed(audition.deadline)
  ) {
    return "deadline passed";
  }
  return audition.status;
}

export function isAuditionOpenForSubmission(audition: Audition): boolean {
  return audition.status === "requested" && !isAuditionDeadlinePassed(audition.deadline);
}

export const auditionStatusVariant: Record<
  string,
  "success" | "warning" | "info" | "accent" | "default"
> = {
  requested: "warning",
  submitted: "accent",
  declined: "default",
  withdrawn: "default",
  accepted: "success",
  "deadline passed": "default",
};

export const auditionStatusLabels: Record<string, string> = {
  requested: "Audition requested",
  submitted: "Audition submitted",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  "deadline passed": "Deadline passed",
};

export function getAuditionStatusLabel(
  status: AuditionDisplayStatus | AuditionStatus,
): string {
  return auditionStatusLabels[status] ?? status;
}
