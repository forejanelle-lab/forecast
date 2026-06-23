"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createMaterialFileId,
  MaterialUploadField,
  type MaterialFile,
} from "@/components/casting/role-material-upload-field";
import { CASTING_ETHNICITY_OPTIONS } from "@/lib/casting-options";
import { formatPlayingAge } from "@/lib/actor-settings-storage";
import { fileToDataUrl } from "@/lib/actor-profile-storage";
import { stripPersistableFileUrl } from "@/lib/role-audition-file-persist";
import { saveRoleMaterials } from "@/lib/role-materials-storage";
import { uploadRoleAuditionMaterials } from "@/lib/role-audition-material-upload";
import { cn, formatDate } from "@/lib/utils";
import type { Project } from "@/types";
import { FileText, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50";

const labelClass = "text-[10px] font-medium text-text-secondary mb-1 block";

function joinEthnicities(values: string[]): string {
  return values.join(", ");
}

export default function NewRolePage({ projects = [] }: { projects: Project[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === "active"),
    [projects],
  );
  const initialProjectId =
    searchParams.get("projectId") ?? activeProjects[0]?.id ?? "";

  const [projectId, setProjectId] = useState(initialProjectId);
  const [characterName, setCharacterName] = useState("");
  const [roleType, setRoleType] = useState("");
  const [playingAgeMin, setPlayingAgeMin] = useState("");
  const [playingAgeMax, setPlayingAgeMax] = useState("");
  const [gender, setGender] = useState("");
  const [compensation, setCompensation] = useState("");
  const [description, setDescription] = useState("");
  const [auditionInstructions, setAuditionInstructions] = useState("");
  const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>(["Open"]);
  const [scriptFiles, setScriptFiles] = useState<MaterialFile[]>([]);
  const [referencePhotoFiles, setReferencePhotoFiles] = useState<MaterialFile[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const addFiles = (
    files: File[],
    setter: React.Dispatch<React.SetStateAction<MaterialFile[]>>,
    withPreview = false,
  ) => {
    if (!files.length) return;
    setter((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: createMaterialFileId(),
        file,
        previewUrl:
          withPreview && file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
      })),
    ]);
  };

  const removeFile = (
    id: string,
    setter: React.Dispatch<React.SetStateAction<MaterialFile[]>>,
  ) => {
    setter((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const toggleEthnicity = (option: string) => {
    if (option === "Open") {
      setSelectedEthnicities(["Open"]);
      return;
    }

    setSelectedEthnicities((prev) => {
      const withoutOpen = prev.filter((item) => item !== "Open");
      if (withoutOpen.includes(option)) {
        const next = withoutOpen.filter((item) => item !== option);
        return next.length > 0 ? next : ["Open"];
      }
      return [...withoutOpen, option];
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setSubmitError("Select a project before creating a role.");
      return;
    }

    if (!description.trim()) {
      setSubmitError("Role description is required.");
      return;
    }

    if (!auditionInstructions.trim()) {
      setSubmitError("Audition instructions are required.");
      return;
    }

    setSubmitError("");
    setLoading(true);

    try {
      const auditionFiles = [
        ...(await Promise.all(
          scriptFiles.map(async (item) => ({
            label: "Script",
            fileName: item.file.name,
            type: "document" as const,
            fileUrl: stripPersistableFileUrl(await fileToDataUrl(item.file)),
          })),
        )),
        ...(await Promise.all(
          referencePhotoFiles.map(async (item) => ({
            label: "Reference photo",
            fileName: item.file.name,
            type: "image" as const,
            fileUrl: stripPersistableFileUrl(await fileToDataUrl(item.file)),
          })),
        )),
      ];

      const res = await fetch(`/api/projects/${projectId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: characterName.trim(),
          roleType: roleType || undefined,
          playingAge:
            formatPlayingAge(playingAgeMin.trim(), playingAgeMax.trim()) || undefined,
          gender: gender.trim() || undefined,
          ethnicity: joinEthnicities(selectedEthnicities),
          compensation: compensation.trim() || undefined,
          description: description.trim(),
          auditionInstructions: auditionInstructions.trim(),
          auditionFiles,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Failed to create role. Please try again.");
        setLoading(false);
        return;
      }

      const roleId = data.role.id as string;
      await saveRoleMaterials(
        roleId,
        scriptFiles.map((item) => item.file),
        referencePhotoFiles.map((item) => item.file),
        auditionInstructions.trim(),
      );
      await uploadRoleAuditionMaterials(
        roleId,
        auditionFiles,
        scriptFiles,
        referencePhotoFiles,
      );

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to create role:", error);
      setSubmitError("Failed to create role. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Create Role</h1>
        <p className="text-sm text-text-secondary mt-1">
          Add a new role to an existing project.
        </p>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="project">Project</label>
            <select
              id="project"
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>Select a project</option>
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title} · Due {formatDate(project.submissionDeadline)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="character-name">Character name</label>
            <input
              id="character-name"
              required
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="role-type">Role type</label>
              <select
                id="role-type"
                required
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className={inputClass}
              >
                <option value="">Select type</option>
                <option value="Lead">Lead</option>
                <option value="Supporting">Supporting</option>
                <option value="Guest">Guest</option>
                <option value="Background">Background</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="playing-age-min">Playing age (min)</label>
              <input
                id="playing-age-min"
                type="number"
                min={1}
                max={99}
                value={playingAgeMin}
                onChange={(e) => setPlayingAgeMin(e.target.value)}
                placeholder="25"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="playing-age-max">Playing age (max)</label>
              <input
                id="playing-age-max"
                type="number"
                min={1}
                max={99}
                value={playingAgeMax}
                onChange={(e) => setPlayingAgeMax(e.target.value)}
                placeholder="35"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="gender">Gender</label>
              <input
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="role-compensation">Compensation</label>
              <input
                id="role-compensation"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <span className={labelClass}>Ethnicity</span>
            <div
              className="rounded-lg border border-border bg-bg-primary p-3 grid sm:grid-cols-2 gap-2"
              role="group"
              aria-label="Ethnicity"
            >
              {CASTING_ETHNICITY_OPTIONS.map((option) => {
                const selected = selectedEthnicities.includes(option);
                return (
                  <label
                    key={option}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors",
                      selected
                        ? "border-accent/50 bg-accent/5 text-text-primary"
                        : "border-border/60 text-text-secondary hover:border-border hover:bg-bg-sidebar/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent/30"
                      checked={selected}
                      onChange={() => toggleEthnicity(option)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="role-description">Role description</label>
            <textarea
              id="role-description"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Character background and casting notes..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="audition-instructions">Audition instructions</label>
            <textarea
              id="audition-instructions"
              required
              rows={3}
              value={auditionInstructions}
              onChange={(e) => setAuditionInstructions(e.target.value)}
              placeholder="What should actors submit?"
              className={inputClass}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-text-primary">Audition materials</p>

            <MaterialUploadField
              id="script-upload"
              label="Script"
              description=""
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              icon={<FileText className="h-3.5 w-3.5" />}
              files={scriptFiles}
              onAdd={(files) => addFiles(files, setScriptFiles)}
              onRemove={(id) => removeFile(id, setScriptFiles)}
            />

            <MaterialUploadField
              id="reference-photo-upload"
              label="Reference photos"
              description=""
              accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
              icon={<ImageIcon className="h-3.5 w-3.5" />}
              files={referencePhotoFiles}
              onAdd={(files) => addFiles(files, setReferencePhotoFiles, true)}
              onRemove={(id) => removeFile(id, setReferencePhotoFiles)}
              showImagePreview
            />
          </div>

          {submitError && (
            <p className="text-xs text-danger">{submitError}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Creating…" : "Create Role"}
            </Button>
            <Link href={projectId ? `/projects/${projectId}` : "/projects"}>
              <Button type="button" variant="secondary" size="sm">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
