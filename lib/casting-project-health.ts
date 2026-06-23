import type { ProjectStatus } from "@/types";

export const LOW_HEALTH_THRESHOLD = 70;

export interface ProjectHealthInput {
  submissions: number;
  reviewed: number;
  auditions: number;
  pendingAuditionReview: number;
  roleCount: number;
  openRoles: number;
  rolesBooked: number;
  deadline?: string | null;
  status?: ProjectStatus | string;
}

export function isLowHealthScore(score: number) {
  return score < LOW_HEALTH_THRESHOLD;
}

function daysUntilDeadline(deadline: string | null | undefined): number | null {
  if (!deadline?.trim()) return null;
  const deadlineMs = new Date(deadline).getTime();
  if (Number.isNaN(deadlineMs)) return null;
  return (deadlineMs - Date.now()) / (1000 * 60 * 60 * 24);
}

export function computeProjectHealthScore(input: ProjectHealthInput): number {
  const bookedRatio =
    input.roleCount > 0 ? input.rolesBooked / input.roleCount : 0;
  const bookedPoints = Math.round(bookedRatio * 40);

  const reviewRate =
    input.submissions > 0 ? input.reviewed / input.submissions : 0;
  const reviewPoints =
    input.submissions > 0
      ? Math.round(reviewRate * 25)
      : bookedRatio > 0
        ? 15
        : 0;

  const submissionPoints = Math.min(15, input.submissions * 3);
  const openRolePoints = Math.min(10, input.openRoles * 3);
  const auditionPoints = Math.min(10, input.auditions * 2);

  const pendingReviewPenalty = Math.min(20, input.pendingAuditionReview * 5);

  let deadlinePenalty = 0;
  const daysUntil = daysUntilDeadline(input.deadline);
  const allRolesBooked =
    input.roleCount > 0 && input.rolesBooked === input.roleCount;

  if (daysUntil !== null && !allRolesBooked) {
    if (daysUntil < 0) deadlinePenalty = 15;
    else if (daysUntil <= 7 && input.submissions < 5) deadlinePenalty = 10;
  }

  const inactivePenalty =
    input.status === "draft" || input.status === "DRAFT" ? 20 : 0;

  const score =
    bookedPoints +
    reviewPoints +
    submissionPoints +
    openRolePoints +
    auditionPoints -
    pendingReviewPenalty -
    deadlinePenalty -
    inactivePenalty;

  let finalScore = Math.max(0, Math.min(100, Math.round(score)));

  if (allRolesBooked) {
    finalScore = Math.max(finalScore, 85);
  } else if (bookedRatio >= 0.5 && input.rolesBooked > 0) {
    finalScore = Math.max(finalScore, 70);
  }

  return finalScore;
}

export function getHealthImprovementTips(
  row: ProjectHealthInput & { healthScore: number },
): string | null {
  if (!isLowHealthScore(row.healthScore)) return null;

  const reasons: string[] = [];
  const actions: string[] = [];

  if (row.roleCount > 0) {
    if (row.rolesBooked === 0) {
      reasons.push(`No roles booked yet (0 of ${row.roleCount})`);
      actions.push("Book an actor from submissions or Review Auditions.");
    } else if (row.rolesBooked < row.roleCount) {
      reasons.push(
        `Only ${row.rolesBooked} of ${row.roleCount} roles booked`,
      );
      if (row.openRoles > 0) {
        actions.push(
          `Fill ${row.openRoles} open role(s) still accepting submissions.`,
        );
      }
    }
  } else {
    reasons.push("No roles on this project");
    actions.push("Add roles so actors can apply.");
  }

  if (row.submissions === 0 && row.rolesBooked === 0) {
    reasons.push("No submissions received");
    actions.push("Share project roles to attract applicants.");
  } else if (row.reviewed < row.submissions) {
    const remaining = row.submissions - row.reviewed;
    reasons.push(
      `${remaining} submission(s) still need review (${row.reviewed}/${row.submissions} reviewed)`,
    );
    actions.push("Open role submissions and mark candidates reviewed or booked.");
  }

  if (row.pendingAuditionReview > 0) {
    reasons.push(
      `${row.pendingAuditionReview} audition submission(s) waiting for feedback`,
    );
    actions.push("Review materials in Review Auditions and book, shortlist, or decline.");
  }

  if (row.auditions === 0 && row.submissions > 0 && row.rolesBooked < row.roleCount) {
    reasons.push("No audition requests sent");
    actions.push("Request auditions from strong candidates to move casting forward.");
  }

  const daysUntil = daysUntilDeadline(row.deadline);
  if (daysUntil === null) {
    reasons.push("No casting end date set");
    actions.push("Set a submission deadline on the project.");
  } else if (daysUntil < 0 && row.rolesBooked < row.roleCount) {
    reasons.push("Submission deadline has passed with roles still open");
    actions.push("Book remaining roles or extend the casting end date.");
  } else if (daysUntil <= 7 && row.submissions < 5 && row.rolesBooked < row.roleCount) {
    reasons.push("Deadline within 7 days with few submissions");
    actions.push("Review existing submissions or extend the deadline.");
  }

  if (row.status === "draft" || row.status === "DRAFT") {
    reasons.push("Project is still in draft");
    actions.push("Activate the project to open casting.");
  }

  if (reasons.length === 0) {
    reasons.push("Pipeline activity is below the healthy threshold");
    actions.push(
      "Keep reviewing submissions, booking roles, and clearing audition reviews.",
    );
  }

  const why = reasons.join("; ");
  const how =
    actions.length > 0
      ? actions.join(" ")
      : "Continue booking open roles and reviewing incoming submissions.";

  return `Score ${row.healthScore} — ${why}. To improve: ${how}`;
}
