import { isSubmissionDeadlinePassed } from "@/lib/message-rules";
import { getBookedActorIdFromData, roleHasBookedActorFromData } from "@/lib/role-booking";

export function effectiveSubmissionDeadline(
  roleSubmissionDeadline: Date | null,
  projectSubmissionDeadline: Date | null,
): Date | null {
  if (roleSubmissionDeadline && projectSubmissionDeadline) {
    return roleSubmissionDeadline < projectSubmissionDeadline
      ? roleSubmissionDeadline
      : projectSubmissionDeadline;
  }
  return roleSubmissionDeadline ?? projectSubmissionDeadline;
}

export function roleAcceptsApplicationsServer(input: {
  roleStatus: string;
  roleSubmissionDeadline: Date | null;
  projectStatus: string;
  projectSubmissionDeadline: Date | null;
  applications?: { status: string; actorId?: string }[];
  auditions?: { status: string; actorId?: string }[];
}): boolean {
  if (input.roleStatus !== "OPEN") return false;
  if (input.projectStatus !== "ACTIVE") return false;

  if (
    roleHasBookedActorFromData({
      applications: input.applications,
      auditions: input.auditions,
    })
  ) {
    return false;
  }

  const deadline = effectiveSubmissionDeadline(
    input.roleSubmissionDeadline,
    input.projectSubmissionDeadline,
  );
  if (deadline) {
    const deadlineStr = deadline.toISOString().slice(0, 10);
    if (isSubmissionDeadlinePassed(deadlineStr)) return false;
  }

  return true;
}

export function countRolesAcceptingApplications<
  TRole extends {
    status: string;
    submissionDeadline: Date | null;
    applications?: { status: string; actorId?: string }[];
    auditions?: { status: string; actorId?: string }[];
  },
  TProject extends {
    status: string;
    submissionDeadline: Date | null;
    roles: TRole[];
  },
>(project: TProject): number {
  return project.roles.filter((role) =>
    roleAcceptsApplicationsServer({
      roleStatus: role.status,
      roleSubmissionDeadline: role.submissionDeadline,
      projectStatus: project.status,
      projectSubmissionDeadline: project.submissionDeadline,
      applications: role.applications,
      auditions: role.auditions,
    }),
  ).length;
}
