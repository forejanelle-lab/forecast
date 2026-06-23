"use client";

import { Button } from "@/components/ui/button";
import { postAuditionRequest } from "@/lib/casting-audition-requests";
import { resolveAuditionDeadline } from "@/lib/audition-utils";
import { buildRoleAuditionPackageFromRole } from "@/lib/role-audition-package";
import { defaultRoleAuditionPackage } from "@/lib/default-role-audition-package";
import { useMounted } from "@/lib/use-mounted";
import type { Project, Role } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

interface RequestAuditionProjectsModalProps {
  actorId: string;
  actorName: string;
  projects: Project[];
  rolesByProject: Record<string, Role[]>;
  auditionRequestedRoleIds?: Set<string>;
  onClose: () => void;
}

export function RequestAuditionProjectsModal({
  actorId,
  actorName,
  projects,
  rolesByProject,
  auditionRequestedRoleIds = new Set(),
  onClose,
}: RequestAuditionProjectsModalProps) {
  const mounted = useMounted();
  const [step, setStep] = useState<"project" | "roles">("project");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  const roles = useMemo(
    () => (selectedProjectId ? rolesByProject[selectedProjectId] ?? [] : []),
    [selectedProjectId, rolesByProject],
  );

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const selectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedRoleIds(new Set());
    setStep("roles");
  };

  const backToProjects = () => {
    setStep("project");
    setSelectedProjectId(null);
    setSelectedRoleIds(new Set());
  };

  const toggleRole = (roleId: string) => {
    if (auditionRequestedRoleIds.has(roleId)) return;
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const toggleAllRoles = (select: boolean) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      roles.forEach((role) => {
        if (auditionRequestedRoleIds.has(role.id)) return;
        if (select) next.add(role.id);
        else next.delete(role.id);
      });
      return next;
    });
  };

  const selectableRoles = roles.filter((role) => !auditionRequestedRoleIds.has(role.id));

  const handleSend = async () => {
    if (sending || selectedRoleIds.size === 0) return;
    setSending(true);
    setSendError(null);

    const selectedRoles = roles.filter((role) => selectedRoleIds.has(role.id));
    const failures: string[] = [];

    for (const role of selectedRoles) {
      const pkg = buildRoleAuditionPackageFromRole(role);

      const result = await postAuditionRequest({
        roleId: role.id,
        actorId,
        deadline: resolveAuditionDeadline(role.submissionDeadline),
        instructions: pkg.instructions || defaultRoleAuditionPackage.instructions,
        uploadRequirements: pkg.uploadRequirements,
      });

      if (!result.ok) {
        failures.push(role.characterName);
      }
    }

    setSending(false);

    if (failures.length === selectedRoles.length) {
      setSendError("Failed to send audition requests. Please try again.");
      return;
    }

    if (failures.length > 0) {
      setSendError(`Some requests failed: ${failures.join(", ")}`);
    }

    setSent(true);
    setTimeout(() => handleClose(), 1200);
  };

  const subtitle =
    step === "project"
      ? `Choose a project for ${actorName} to submit to.`
      : `Select roles on ${selectedProject?.title} for ${actorName}.`;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain">
      <button
        type="button"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close"
      />
      <div className="relative flex min-h-full items-start justify-center p-4 sm:p-6">
        <div
          className="relative flex w-full max-w-lg max-h-[calc(100dvh-2rem)] my-4 sm:my-8 flex-col rounded-[20px] bg-bg-secondary border border-border/60 shadow-[var(--shadow-card)] animate-fade-in overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-audition-title"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 px-6 py-5 border-b border-border/60">
            <div className="min-w-0">
              {step === "roles" && (
                <button
                  type="button"
                  onClick={backToProjects}
                  className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-accent mb-2 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  All projects
                </button>
              )}
              <h2
                id="request-audition-title"
                className="text-base font-semibold text-text-primary"
              >
                Request audition
              </h2>
              <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors shrink-0"
              aria-label="Close request audition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {sent ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm font-medium text-text-primary">
                  Audition request sent to {actorName}.
                </p>
              </div>
            ) : projects.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-text-secondary">
                  No active projects found. Create a project to request submissions.
                </p>
              </div>
            ) : step === "project" ? (
              <div className="px-6 py-5">
                <ul className="divide-y divide-border/60 rounded-xl border border-border/60 overflow-hidden">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <button
                        type="button"
                        onClick={() => selectProject(project.id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-bg-sidebar/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary">{project.title}</p>
                          <p className="text-xs text-text-secondary mt-0.5">
                            {project.projectType} · {project.location}
                          </p>
                        </div>
                        <span className="text-xs text-accent shrink-0">Select</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : roles.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-text-secondary">No open roles on this project.</p>
              </div>
            ) : (
              <div className="px-6 py-5">
                {sendError && (
                  <p className="text-xs text-danger mb-3">{sendError}</p>
                )}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                    Open roles
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      toggleAllRoles(
                        !selectableRoles.every((role) => selectedRoleIds.has(role.id)),
                      )
                    }
                    className="text-[10px] font-medium text-accent hover:underline"
                  >
                    {selectableRoles.length > 0 &&
                    selectableRoles.every((role) => selectedRoleIds.has(role.id))
                      ? "Deselect all"
                      : "Select all"}
                  </button>
                </div>
                <ul className="divide-y divide-border/60 rounded-xl border border-border/60 overflow-hidden">
                  {roles.map((role) => {
                    const selected = selectedRoleIds.has(role.id);
                    const alreadyRequested = auditionRequestedRoleIds.has(role.id);
                    return (
                      <li key={role.id}>
                        <button
                          type="button"
                          onClick={() => toggleRole(role.id)}
                          disabled={alreadyRequested}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            alreadyRequested
                              ? "bg-bg-sidebar/40 opacity-60 cursor-not-allowed"
                              : selected
                                ? "bg-accent/10"
                                : "hover:bg-bg-sidebar/50",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              alreadyRequested
                                ? "border-border/60 bg-bg-sidebar text-text-secondary"
                                : selected
                                  ? "border-accent bg-accent text-white"
                                  : "border-border bg-bg-primary",
                            )}
                            aria-hidden
                          >
                            {selected && !alreadyRequested && (
                              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                                <path
                                  d="M2 6l3 3 5-6"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-text-primary">
                              {role.characterName}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {alreadyRequested
                                ? "Audition already requested"
                                : `${role.roleType} · ${role.playingAge}`}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {!sent && step === "roles" && roles.length > 0 && (
            <div className="flex shrink-0 gap-3 px-6 py-4 border-t border-border/60 bg-bg-primary/50">
              <Button variant="secondary" size="sm" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={handleSend}
                disabled={selectedRoleIds.size === 0 || sending}
              >
                <Send className="h-3.5 w-3.5" />
                {sending ? "Sending..." : "Send audition request"}
              </Button>
            </div>
          )}

          {step === "project" && projects.length > 0 && !sent && (
            <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-bg-primary/50">
              <Button variant="secondary" size="sm" className="w-full" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
