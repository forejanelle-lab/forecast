"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50";

const labelClass = "text-[10px] font-medium text-text-secondary mb-1 block";

const PROJECT_TYPE_OPTIONS = [
  "Feature Film",
  "Television Series",
  "Limited Series",
  "Commercial",
  "Short Film",
  "Web Series",
  "Documentary",
  "Theater",
];

const UNION_STATUS_OPTIONS = [
  "SAG-AFTRA",
  "Non-Union",
  "SAG-AFTRA Modified Low Budget",
  "SAG-AFTRA Low Budget",
  "SAG-AFTRA Ultra Low Budget",
  "SAG-AFTRA New Media",
  "SAG-AFTRA Short Project",
  "Equity (AEA)",
  "Union & Non-Union",
];

function isDateBefore(date: string, minDate: string) {
  return date < minDate;
}

function formatShootDates(start: string, end: string): string | undefined {
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return undefined;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState("");
  const [unionStatus, setUnionStatus] = useState("");
  const [location, setLocation] = useState("");
  const [castingEndDate, setCastingEndDate] = useState("");
  const [shootStartDate, setShootStartDate] = useState("");
  const [shootEndDate, setShootEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [dateError, setDateError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const shootDateMin = castingEndDate || undefined;
  const shootEndDateMin = shootStartDate || castingEndDate || undefined;

  function handleCastingEndDateChange(value: string) {
    setCastingEndDate(value);
    setDateError("");
    if (value && shootStartDate && isDateBefore(shootStartDate, value)) {
      setShootStartDate("");
    }
    if (value && shootEndDate && isDateBefore(shootEndDate, value)) {
      setShootEndDate("");
    }
  }

  function handleShootStartDateChange(value: string) {
    setShootStartDate(value);
    setDateError("");
    if (value && shootEndDate && isDateBefore(shootEndDate, value)) {
      setShootEndDate("");
    }
  }

  function handleShootEndDateChange(value: string) {
    setShootEndDate(value);
    setDateError("");
  }

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
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          projectType: projectType.trim(),
          unionStatus: unionStatus || undefined,
          location: location.trim() || undefined,
          submissionDeadline: castingEndDate || undefined,
          shootDates: formatShootDates(shootStartDate, shootEndDate),
          description: description.trim() || undefined,
          status: "active",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Failed to create project. Please try again.");
        setLoading(false);
        return;
      }

      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to create project:", error);
      setSubmitError("Failed to create project. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">New Project</h1>
        <p className="text-sm text-text-secondary mt-1">
          Create a casting project and start adding roles.
        </p>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="project-title">Project title</label>
            <input
              id="project-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Midnight Harbor"
              className={inputClass}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="project-type">Project type</label>
              <input
                id="project-type"
                required
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                list="project-type-options"
                placeholder="Feature Film or type your own"
                className={inputClass}
              />
              <datalist id="project-type-options">
                {PROJECT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelClass} htmlFor="union-status">Union status</label>
              <select
                id="union-status"
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
              <label className={labelClass} htmlFor="location">Location</label>
              <input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Los Angeles, CA"
                className={inputClass}
              />
            </div>
            <div>
              <Tooltip content="Actors will no longer be able to apply after this date.">
                <label
                  className={`${labelClass} inline-flex cursor-help`}
                  htmlFor="casting-end-date"
                >
                  Casting End Date
                </label>
              </Tooltip>
              <input
                id="casting-end-date"
                type="date"
                value={castingEndDate}
                onChange={(e) => handleCastingEndDateChange(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="shoot-start">Shoot start date</label>
              <input
                id="shoot-start"
                type="date"
                value={shootStartDate}
                min={shootDateMin}
                onChange={(e) => handleShootStartDateChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="shoot-end">Shoot end date</label>
              <input
                id="shoot-end"
                type="date"
                value={shootEndDate}
                min={shootEndDateMin}
                onChange={(e) => handleShootEndDateChange(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {dateError && (
            <p className="text-xs text-danger">{dateError}</p>
          )}

          <div>
            <label className={labelClass} htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief project overview for talent..."
              className={inputClass}
            />
          </div>

          {submitError && (
            <p className="text-xs text-danger">{submitError}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Creating…" : "Create Project"}
            </Button>
            <Link href="/projects">
              <Button type="button" variant="secondary" size="sm">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
