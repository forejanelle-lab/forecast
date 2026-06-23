"use client";

import { Button } from "@/components/ui/button";
import { RoleSubmissionModal } from "@/components/actor/role-submission-modal";
import { RoleAcceptanceBadge } from "@/components/role/role-acceptance-badge";
import {
  roleAcceptsSubmissionsForRole,
  subscribeRoleAcceptance,
} from "@/lib/role-acceptance-storage";
import type { Application, Role } from "@/types";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useState } from "react";

function useRoleAcceptsSubmissions(roleId: string, fallbackStatus: Role["status"]) {
  return useSyncExternalStore(
    subscribeRoleAcceptance,
    () => roleAcceptsSubmissionsForRole(roleId, fallbackStatus),
    () => fallbackStatus === "open",
  );
}

interface ActorRoleSubmitSectionProps {
  role: Role;
  existingApplication?: Application;
  hasAudition?: boolean;
}

export function ActorRoleSubmitSection({
  role,
  existingApplication,
  hasAudition = false,
}: ActorRoleSubmitSectionProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const hasApplied = !!existingApplication;
  const acceptsSubmissions = useRoleAcceptsSubmissions(role.id, role.status);
  const canSubmit = acceptsSubmissions && !hasApplied && !hasAudition;

  const statusMessage = hasAudition
    ? "You have an audition request for this role."
    : hasApplied
      ? `Submitted ${formatDateTime(existingApplication.submittedAt)}`
      : acceptsSubmissions
        ? `Submission deadline: ${formatDate(role.submissionDeadline)}`
        : "This role is not accepting new submissions right now.";

  const buttonLabel = hasAudition
    ? "Audition on this role"
    : hasApplied
      ? "Application Submitted"
      : acceptsSubmissions
        ? "Submit Application"
        : "Submissions Closed";

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/60">
        <div className="space-y-2">
          <RoleAcceptanceBadge
            roleId={role.id}
            fallbackStatus={role.status}
            className="text-[10px] px-2 py-0.5"
          />
          <p className="text-sm text-text-secondary">{statusMessage}</p>
        </div>
        <Button
          size="lg"
          variant={hasApplied || hasAudition || !acceptsSubmissions ? "secondary" : "primary"}
          disabled={!canSubmit}
          className={cn(
            "min-h-[48px] px-8",
            (hasApplied || hasAudition || !acceptsSubmissions) &&
              "disabled:bg-bg-sidebar disabled:text-text-secondary disabled:border-border disabled:opacity-100 disabled:cursor-not-allowed",
          )}
          onClick={() => canSubmit && setModalOpen(true)}
        >
          {buttonLabel}
        </Button>
      </div>

      {modalOpen && (
        <RoleSubmissionModal
          role={role}
          projectTitle={role.projectTitle}
          acceptsSubmissions={acceptsSubmissions}
          hasApplied={hasApplied}
          hasAudition={hasAudition}
          onClose={() => setModalOpen(false)}
          onSubmitted={() => router.refresh()}
        />
      )}
    </>
  );
}
