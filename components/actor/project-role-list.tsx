"use client";

import { RoleSubmissionModal } from "@/components/actor/role-submission-modal";
import { RoleAcceptanceBadge } from "@/components/role/role-acceptance-badge";
import {
  createRoleAcceptanceRolesStore,
  roleAcceptsSubmissionsForRole,
} from "@/lib/role-acceptance-storage";
import { formatRoleMetaLine } from "@/lib/role-display";
import { isRoleFitForActor } from "@/lib/role-match";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore, useState } from "react";

interface ProjectRoleListProps {
  roles: Role[];
  projectTitle: string;
  submissionsOpen?: boolean;
  appliedRoleIds?: string[];
  auditionRoleIds?: string[];
  actorProfile?: {
    playingAge: string;
    gender: string;
    ethnicities?: string[];
  } | null;
}

export function ProjectRoleList({
  roles,
  projectTitle,
  submissionsOpen = true,
  appliedRoleIds = [],
  auditionRoleIds = [],
  actorProfile = null,
}: ProjectRoleListProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const appliedSet = useMemo(() => new Set(appliedRoleIds), [appliedRoleIds]);
  const auditionSet = useMemo(() => new Set(auditionRoleIds), [auditionRoleIds]);

  const rolesStore = useMemo(
    () => createRoleAcceptanceRolesStore(roles),
    [roles],
  );

  const effectiveRoles = useSyncExternalStore(
    rolesStore.subscribe,
    rolesStore.getSnapshot,
    rolesStore.getServerSnapshot,
  );

  if (roles.length === 0) {
    return <p className="text-sm text-text-secondary">No roles for this project.</p>;
  }

  const openRole = (role: Role) => {
    if (!submissionsOpen) return;
    if (appliedSet.has(role.id) || auditionSet.has(role.id)) return;
    const baseRole = roles.find((entry) => entry.id === role.id) ?? role;
    if (!roleAcceptsSubmissionsForRole(role.id, baseRole.status)) return;
    setSelectedRole(role);
  };

  return (
    <>
      <div className="divide-y divide-border/60">
        {effectiveRoles.map((role) => {
          const baseRole = roles.find((entry) => entry.id === role.id) ?? role;
          const hasApplied = appliedSet.has(role.id);
          const hasAudition = auditionSet.has(role.id);
          const acceptsSubmissions =
            submissionsOpen &&
            roleAcceptsSubmissionsForRole(role.id, baseRole.status);
          const isMatch =
            actorProfile != null && isRoleFitForActor(role, actorProfile);
          const canOpen = acceptsSubmissions && !hasApplied && !hasAudition;
          const metaLine = formatRoleMetaLine(role);

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => openRole(role)}
              disabled={!canOpen}
              className={cn(
                "flex w-full items-center justify-between gap-3 py-2 text-left transition-colors",
                canOpen
                  ? "hover:bg-bg-sidebar/50"
                  : "opacity-60 cursor-not-allowed",
              )}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    hasApplied || hasAudition
                      ? "text-text-secondary"
                      : isMatch
                        ? "text-accent font-semibold"
                        : "text-text-primary",
                  )}
                >
                  {role.characterName}
                </p>
                {metaLine && (
                  <p className="text-xs text-text-secondary mt-0.5">{metaLine}</p>
                )}
                {role.description.trim() && (
                  <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                    {role.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(hasApplied || hasAudition) && (
                  <span className="text-[9px] font-medium uppercase tracking-wide text-text-secondary">
                    Applied
                  </span>
                )}
                <RoleAcceptanceBadge
                  roleId={role.id}
                  fallbackStatus={baseRole.status}
                  className="text-[9px] px-1.5 py-0 shrink-0"
                />
              </div>
            </button>
          );
        })}
      </div>

      {selectedRole && (
        <RoleSubmissionModal
          role={selectedRole}
          projectTitle={projectTitle}
          acceptsSubmissions={
            submissionsOpen &&
            roleAcceptsSubmissionsForRole(
              selectedRole.id,
              (roles.find((entry) => entry.id === selectedRole.id) ?? selectedRole).status,
            )
          }
          hasApplied={appliedSet.has(selectedRole.id)}
          hasAudition={auditionSet.has(selectedRole.id)}
          onClose={() => setSelectedRole(null)}
          onSubmitted={() => router.refresh()}
        />
      )}
    </>
  );
}
