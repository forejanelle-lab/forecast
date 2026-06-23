import { castingSubmissionActionKey } from "@/lib/casting-submission-action-keys";
import type {
  ApplicationStatus,
  Audition,
  AuditionSubmission,
  AuditionSubmissionItem,
  ProjectStatus,
} from "@/types";

export interface CastingAuditionSubmissionRow {
  auditionId: string;
  actorId: string;
  actorName: string;
  actorInitials: string;
  actorPhotoUrl?: string;
  roleId?: string;
  roleName: string;
  projectId: string;
  projectTitle: string;
  submittedAt: string;
  items: AuditionSubmissionItem[];
  status: ApplicationStatus;
  projectStatus?: ProjectStatus;
  submissionDeadline?: string;
  castingDirector?: string;
  shootDates?: string;
  roleBookedActorId?: string | null;
  bookingOfferSent?: boolean;
}

function statusFromAudition(audition: Audition): ApplicationStatus | undefined {
  if (audition.status === "accepted") return "accepted";
  if (audition.status === "declined" || audition.status === "withdrawn") return "rejected";
  return undefined;
}

export function buildCastingAuditionSubmissionRows(
  auditions: Audition[],
  submissions: Record<string, AuditionSubmission>,
  reviews: Record<string, ApplicationStatus>,
  bookedActorsByRole: Record<string, string> = {},
  bookingOfferSentKeys: Set<string> = new Set(),
): CastingAuditionSubmissionRow[] {
  const rows: CastingAuditionSubmissionRow[] = [];

  for (const audition of auditions) {
    if (!audition.actorId || !audition.actorName || !audition.actorInitials) {
      continue;
    }

    const submission =
      submissions[audition.id] ?? audition.submission;
    if (!submission) continue;

    rows.push({
      auditionId: audition.id,
      actorId: audition.actorId,
      actorName: audition.actorName,
      actorInitials: audition.actorInitials,
      actorPhotoUrl: audition.actorPhotoUrl,
      roleId: audition.roleId,
      roleName: audition.roleName,
      projectId: audition.projectId ?? "",
      projectTitle: audition.projectTitle,
      submittedAt: submission.submittedAt,
      items: submission.items,
      status: reviews[audition.id] ?? statusFromAudition(audition) ?? "submitted",
      castingDirector: audition.castingDirector,
      roleBookedActorId: audition.roleId
        ? bookedActorsByRole[audition.roleId] ?? null
        : null,
      bookingOfferSent: audition.roleId
        ? bookingOfferSentKeys.has(
            castingSubmissionActionKey(audition.roleId, audition.actorId),
          )
        : false,
    });
  }

  return rows.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}
