"use client";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import {
  formatShootDates,
  isDateBefore,
  PROJECT_TYPE_OPTIONS,
  parseShootDatesForForm,
  UNION_STATUS_OPTIONS,
} from "@/lib/project-form-shared";
import { useMounted } from "@/lib/use-mounted";
import type { Project } from "@/types";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50";

const labelClass = "text-[10px] font-medium text-text-secondary mb-1 block";

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
}

export function EditProjectModal({ project, onClose }: EditProjectModalProps) {
  const mounted = useMounted();
  const router = useRouter();
  const initialShoot = parseShootDatesForForm(project.shootDates);

  const [title, setTitle] = useState(project.title);
  const [projectType, setProjectType] = useState(project.projectType);
  const [unionStatus, setUnionStatus] = useState(project.unionStatus);
  const [location, setLocation] = useState(project.location);
  const [castingEndDate, setCastingEndDate] = useState(project.submissionDeadline);
  const [shootStartDate, setShootStartDate] = useState(initialShoot.start);
  const [shootEndDate, setShootEndDate] = useState(initialShoot.end);
  const [description, setDescription] = useState(project.description);
  const [dateError, setDateError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const shootDateMin = castingEndDate || undefined;
  const shootEndDateMin = shootStartDate || castingEndDate || undefined;

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDateError("");
    setSubmitError("");

    if (castingEndDate) {
      if (shootStartDate && isDateBefore(shootStartDate, castingEndDate)) {
        setDateError("Shoot start date cannot be before the casting end date.");
        return;
      }
      if (shootEndDate && isDateBefore(shootEndDate, castingEndDate)) {
        setDateError("Shoot end date cannot be before the casting end date.");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          projectType: projectType.trim(),
          unionStatus: unionStatus || undefined,
          location: location.trim() || undefined,
          submissionDeadline: castingEndDate || null,
          shootDates: formatShootDates(shootStartDate, shootEndDate),
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error ?? "Failed to update project. Please try again.");
        setLoading(false);
        return;
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Failed to update project:", error);
      setSubmitError("Failed to update project. Please try again.");
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain">
      <button
        type="button"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close edit project"
      />
      <div className="relative flex min-h-full items-start justify-center p-4 sm:p-6">
        <div
          className="relative w-full max-w-2xl rounded-[20px] bg-bg-secondary border border-border/60 shadow-[var(--shadow-card)] animate-fade-in overflow-hidden my-4 sm:my-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-project-dialog-title"
        >
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border/60">
            <div>
              <h2
                id="edit-project-dialog-title"
                className="text-base font-semibold text-text-primary"
              >
                Edit project
              </h2>
              <p className="text-sm text-text-secondary mt-0.5">
                Update project details for casting and talent.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-text-secondary hover:text-text-primary shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[calc(100dvh-10rem)] overflow-y-auto">
            <div>
              <label className={labelClass} htmlFor="edit-project-title">Project title</label>
              <input
                id="edit-project-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="edit-project-type">Project type</label>
                <input
                  id="edit-project-type"
                  required
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  list="edit-project-type-options"
                  className={inputClass}
                />
                <datalist id="edit-project-type-options">
                  {PROJECT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-union-status">Union status</label>
                <select
                  id="edit-union-status"
                  value={unionStatus}
                  onChange={(e) => setUnionStatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select union status</option>
                  {UNION_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="edit-location">Location</label>
                <input
                  id="edit-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Tooltip content="Actors will no longer be able to apply after this date.">
                  <label
                    className={`${labelClass} inline-flex cursor-help`}
                    htmlFor="edit-casting-end-date"
                  >
                    Casting end date
                  </label>
                </Tooltip>
                <input
                  id="edit-casting-end-date"
                  type="date"
                  value={castingEndDate}
                  onChange={(e) => {
                    setCastingEndDate(e.target.value);
                    setDateError("");
                  }}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="edit-shoot-start">Shoot start date</label>
                <input
                  id="edit-shoot-start"
                  type="date"
                  value={shootStartDate}
                  min={shootDateMin}
                  onChange={(e) => {
                    setShootStartDate(e.target.value);
                    setDateError("");
                  }}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-shoot-end">Shoot end date</label>
                <input
                  id="edit-shoot-end"
                  type="date"
                  value={shootEndDate}
                  min={shootEndDateMin}
                  onChange={(e) => {
                    setShootEndDate(e.target.value);
                    setDateError("");
                  }}
                  className={inputClass}
                />
              </div>
            </div>
            {dateError && <p className="text-xs text-danger">{dateError}</p>}

            <div>
              <label className={labelClass} htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>

            {submitError && <p className="text-xs text-danger">{submitError}</p>}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
