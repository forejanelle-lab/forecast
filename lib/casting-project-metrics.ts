type RoleApplicationRow = { actorId: string; status: string };
type RoleAuditionRow = { actorId: string; status: string };

const APPLICATION_REVIEWED_STATUSES = new Set([
  "AUDITION_VIEWED",
  "REVIEWING",
  "CALLBACK",
  "REJECTED",
  "ACCEPTED",
]);

const CASTING_ACTED_ON_AUDITION_APPLICATION_STATUSES = new Set([
  "CALLBACK",
  "REJECTED",
  "ACCEPTED",
]);

function findApplicationForActor(
  applications: RoleApplicationRow[],
  actorId: string,
): RoleApplicationRow | undefined {
  return applications.find((app) => app.actorId === actorId);
}

function isWithdrawnAudition(audition: RoleAuditionRow): boolean {
  return audition.status === "WITHDRAWN";
}

/** Audition requests still waiting on the actor (materials or decline). */
export function countAwaitingActorAuditionResponse(auditions: RoleAuditionRow[]): number {
  return auditions.filter((audition) => audition.status === "REQUESTED").length;
}

/** Submitted audition materials casting has not finished reviewing. */
export function isAuditionAwaitingCastingReview(
  audition: RoleAuditionRow,
  application: RoleApplicationRow | undefined,
): boolean {
  if (isWithdrawnAudition(audition)) return false;
  if (audition.status !== "SUBMITTED") return false;

  if (application && CASTING_ACTED_ON_AUDITION_APPLICATION_STATUSES.has(application.status)) {
    return false;
  }

  return true;
}

/** Audition submission was reviewed or acted on from the review auditions flow. */
export function isAuditionSubmissionReviewed(
  audition: RoleAuditionRow,
  application: RoleApplicationRow | undefined,
): boolean {
  if (isWithdrawnAudition(audition)) return false;

  if (audition.status === "ACCEPTED" || audition.status === "COMPLETED") return true;
  if (audition.status === "DECLINED") return true;

  if (audition.status === "SUBMITTED") {
    if (!application) return false;
    return CASTING_ACTED_ON_AUDITION_APPLICATION_STATUSES.has(application.status);
  }

  if (!application) return false;
  return APPLICATION_REVIEWED_STATUSES.has(application.status);
}

export function countPendingAuditionReviews(
  auditions: RoleAuditionRow[],
  applications: RoleApplicationRow[],
): number {
  return auditions.filter((audition) => {
    const application = findApplicationForActor(applications, audition.actorId);
    return isAuditionAwaitingCastingReview(audition, application);
  }).length;
}

export function countReviewedSubmissions(
  applications: RoleApplicationRow[],
  auditions: RoleAuditionRow[],
): number {
  const reviewedApplications = applications.filter(
    (app) => app.status !== "SUBMITTED",
  ).length;

  const auditionOnlyReviewed = auditions.filter((audition) => {
    if (isWithdrawnAudition(audition)) return false;
    const application = findApplicationForActor(applications, audition.actorId);
    if (application && application.status !== "SUBMITTED") return false;
    return isAuditionSubmissionReviewed(audition, application);
  }).length;

  return reviewedApplications + auditionOnlyReviewed;
}
