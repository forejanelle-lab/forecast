"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createMaterialFileId,
  MaterialUploadField,
  type MaterialFile,
} from "@/components/casting/role-material-upload-field";
import { CASTING_ETHNICITY_OPTIONS } from "@/lib/casting-options";
import {
  clearRoleAcceptanceStatus,
  mergeRolesWithAcceptanceStatus,
} from "@/lib/role-acceptance-storage";
import { buildAuditionFilesForPersist } from "@/lib/role-audition-file-persist";
import { uploadRoleAuditionMaterials } from "@/lib/role-audition-material-upload";
import {
  getRoleAuditionPackage,
  updateRoleMaterials,
} from "@/lib/role-materials-storage";
import { roleSubmissionsTag } from "@/lib/role-submissions-status";
import type { Role, RoleAuditionFile, RoleStatus } from "@/types";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { FileText, ImageIcon, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50";

const labelClass = "text-[10px] font-medium text-text-secondary mb-1 block";

function parseEthnicities(value: string): string[] {
  if (!value.trim()) return ["Open"];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function joinEthnicities(values: string[]): string {
  return values.join(", ");
}

function auditionFileNames(files: RoleAuditionFile[]): string {
  return files
    .map((file) => file.fileName)
    .sort()
    .join("\0");
}

interface ProjectRolesListProps {
  projectId: string;
  initialRoles: Role[];
}

export function ProjectRolesList({ projectId, initialRoles }: ProjectRolesListProps) {
  const router = useRouter();
  const [roles, setRoles] = useState(() => mergeRolesWithAcceptanceStatus(initialRoles));
  const [menuRoleId, setMenuRoleId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const editModalScrollRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  useEffect(() => {
    setRoles(mergeRolesWithAcceptanceStatus(initialRoles));
  }, [initialRoles]);

  useEffect(() => {
    if (!editingRole) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      editModalScrollRef.current?.scrollTo({ top: 0 });
    });

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editingRole]);

  useEffect(() => {
    if (!menuRoleId) return;
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuRoleId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuRoleId]);

  const stopAcceptingSubmissions = async (roleId: string) => {
    const response = await fetch(`/api/roles/${roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    if (!response.ok) return;

    clearRoleAcceptanceStatus(roleId);
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId ? { ...role, status: "closed" as RoleStatus } : role,
      ),
    );
    setMenuRoleId(null);
  };

  const resumeAcceptingSubmissions = async (roleId: string) => {
    const response = await fetch(`/api/roles/${roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "open" }),
    });
    if (!response.ok) return;

    clearRoleAcceptanceStatus(roleId);
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId ? { ...role, status: "open" as RoleStatus } : role,
      ),
    );
    setMenuRoleId(null);
  };

  const confirmDelete = async () => {
    if (!deleteRole) return;

    const response = await fetch(`/api/roles/${deleteRole.id}`, { method: "DELETE" });
    if (!response.ok) return;

    clearRoleAcceptanceStatus(deleteRole.id);
    setRoles((prev) => prev.filter((role) => role.id !== deleteRole.id));
    setDeleteRole(null);
    router.refresh();
  };

  const saveEdit = (updated: Role) => {
    clearRoleAcceptanceStatus(updated.id);
    setRoles((prev) =>
      mergeRolesWithAcceptanceStatus(
        prev.map((role) => (role.id === updated.id ? updated : role)),
      ),
    );
    setEditingRole(null);
    router.refresh();
  };

  return (
    <>
      <Card padding="sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="text-sm font-semibold text-text-primary">Roles</h2>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            {roles.length}
          </Badge>
        </div>
        <div className="divide-y divide-border/60">
          {roles.length === 0 ? (
            <p className="text-xs text-text-secondary py-2">No roles yet for this project.</p>
          ) : (
            roles.map((role) => {
              const submissionsTag = roleSubmissionsTag(role.status);
              return (
              <div
                key={role.id}
                className="flex items-center gap-2 py-2 first:pt-0 last:pb-0 hover:bg-bg-sidebar/50 transition-colors"
              >
                <Link
                  href={`/projects/${projectId}/roles/${role.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="text-sm font-medium text-text-primary truncate hover:text-accent transition-colors">
                    {role.characterName}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {role.roleType} · Playing age {role.playingAge}
                  </p>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-text-secondary hidden sm:block">
                    {role.submissionCount} submissions
                  </span>
                  <Badge
                    variant={submissionsTag.variant}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {submissionsTag.label}
                  </Badge>
                  <div className="relative" ref={menuRoleId === role.id ? menuRef : undefined}>
                    <button
                      type="button"
                      onClick={() =>
                        setMenuRoleId((current) => (current === role.id ? null : role.id))
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors"
                      aria-label={`Manage ${role.characterName}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {menuRoleId === role.id && (
                      <div
                        className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-border bg-bg-secondary py-1 shadow-[var(--shadow-card)] animate-fade-in"
                      >
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-xs text-text-primary hover:bg-bg-sidebar/80"
                          onClick={() => {
                            setEditingRole(role);
                            setMenuRoleId(null);
                          }}
                        >
                          Edit role
                        </button>
                        {role.status === "open" && (
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-xs text-text-primary hover:bg-bg-sidebar/80"
                            onClick={() => stopAcceptingSubmissions(role.id)}
                          >
                            Stop accepting submissions
                          </button>
                        )}
                        {role.status === "closed" && (
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-xs text-text-primary hover:bg-bg-sidebar/80"
                            onClick={() => resumeAcceptingSubmissions(role.id)}
                          >
                            Resume accepting submissions
                          </button>
                        )}
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-xs text-danger hover:bg-danger/5"
                          onClick={() => {
                            setDeleteRole(role);
                            setMenuRoleId(null);
                          }}
                        >
                          Delete role
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>
      </Card>

      {editingRole &&
        mounted &&
        createPortal(
          <div
            ref={editModalScrollRef}
            className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain"
          >
            <div
              className="fixed inset-0 bg-black/40"
              aria-hidden="true"
              onClick={() => setEditingRole(null)}
            />
            <div className="relative flex min-h-full items-start justify-center p-4 sm:p-6">
              <Card
                padding="md"
                className="relative w-full max-w-lg my-4 sm:my-8 max-h-[calc(100dvh-2rem)] overflow-y-auto"
              >
                <div className="sticky top-0 z-10 -mx-6 px-6 pt-0 pb-4 mb-2 bg-bg-secondary border-b border-border/60 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Edit role</h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Update role details for {editingRole.projectTitle}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="text-text-secondary hover:text-text-primary shrink-0"
                    aria-label="Close edit role"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <EditRoleForm
                  role={editingRole}
                  onSave={saveEdit}
                  onCancel={() => setEditingRole(null)}
                />
              </Card>
            </div>
          </div>,
          document.body,
        )}

      {deleteRole &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain">
            <button
              type="button"
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteRole(null)}
              aria-label="Close delete role"
            />
            <div className="relative flex min-h-full items-center justify-center p-4">
              <Card padding="md" className="relative w-full max-w-sm">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Delete role?</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Remove <strong className="text-text-primary">{deleteRole.characterName}</strong> from
                  this project? This cannot be undone.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={confirmDelete}
                  >
                    Delete role
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setDeleteRole(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function EditRoleForm({
  role,
  onSave,
  onCancel,
}: {
  role: Role;
  onSave: (role: Role) => void;
  onCancel: () => void;
}) {
  const [characterName, setCharacterName] = useState(role.characterName);
  const [roleType, setRoleType] = useState(role.roleType);
  const [playingAge, setPlayingAge] = useState(role.playingAge);
  const [gender, setGender] = useState(role.gender);
  const [compensation, setCompensation] = useState(role.compensation);
  const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>(
    parseEthnicities(role.ethnicity),
  );
  const [description, setDescription] = useState(role.description);
  const [auditionInstructions, setAuditionInstructions] = useState(
    role.auditionInstructions,
  );
  const [existingFiles, setExistingFiles] = useState<RoleAuditionFile[]>(() => {
    if (role.auditionFiles?.length) return role.auditionFiles;
    return getRoleAuditionPackage(role.id).files;
  });
  const initialFileNamesRef = useRef(
    (role.auditionFiles?.length
      ? role.auditionFiles
      : getRoleAuditionPackage(role.id).files).map((file) => file.fileName),
  );
  const [scriptFiles, setScriptFiles] = useState<MaterialFile[]>([]);
  const [referencePhotoFiles, setReferencePhotoFiles] = useState<MaterialFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      for (const item of scriptFiles) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      for (const item of referencePhotoFiles) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, [scriptFiles, referencePhotoFiles]);

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

  const removeNewFile = (
    id: string,
    setter: React.Dispatch<React.SetStateAction<MaterialFile[]>>,
  ) => {
    setter((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const removeExistingFile = (fileName: string) => {
    setExistingFiles((prev) => prev.filter((file) => file.fileName !== fileName));
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

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
          const hasNewUploads =
            scriptFiles.length > 0 || referencePhotoFiles.length > 0;
          const hasFileListChanges =
            hasNewUploads ||
            auditionFileNames(existingFiles) !==
              auditionFileNames(
                initialFileNamesRef.current.map((fileName) => ({
                  label: "",
                  fileName,
                  type: "document",
                })),
              );

          const payload: Record<string, unknown> = {
            characterName,
            roleType,
            playingAge,
            gender,
            compensation,
            ethnicity: joinEthnicities(selectedEthnicities),
            description,
            auditionInstructions,
          };

          let auditionFiles: RoleAuditionFile[] | undefined;
          if (hasFileListChanges) {
            auditionFiles = await buildAuditionFilesForPersist(
              role.id,
              existingFiles,
              scriptFiles.map((item) => item.file),
              referencePhotoFiles.map((item) => item.file),
            );
            payload.auditionFiles = auditionFiles;
          }

          const res = await fetch(`/api/roles/${role.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          let data: { error?: string; role?: Role; materialsWarning?: string } = {};
          try {
            data = await res.json();
          } catch {
            if (!res.ok) {
              setError("Failed to save role. The request may be too large.");
              setSaving(false);
              return;
            }
          }

          if (!res.ok) {
            setError(data.error ?? "Failed to save role. Please try again.");
            setSaving(false);
            return;
          }

          if (!data.role) {
            setError("Failed to save role. Please try again.");
            setSaving(false);
            return;
          }

          if (auditionFiles || scriptFiles.length > 0 || referencePhotoFiles.length > 0) {
            try {
              await updateRoleMaterials(role.id, {
                keepFiles: existingFiles,
                newScripts: scriptFiles.map((item) => item.file),
                newPhotos: referencePhotoFiles.map((item) => item.file),
                instructions: auditionInstructions,
              });
              await uploadRoleAuditionMaterials(
                role.id,
                auditionFiles ?? existingFiles,
                scriptFiles,
                referencePhotoFiles,
              );
            } catch (materialsError) {
              console.warn("Failed to cache or upload role materials:", materialsError);
            }
          }

          if (data.materialsWarning) {
            onSave(data.role);
            setError(data.materialsWarning);
            setSaving(false);
            return;
          }

          onSave(data.role);
          setSaving(false);
        } catch (saveError) {
          console.error("Failed to save role:", saveError);
          setError("Failed to save role. Please try again.");
          setSaving(false);
        }
      }}
    >
      <div>
        <label className={labelClass} htmlFor="edit-character-name">Character name</label>
        <input
          id="edit-character-name"
          required
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="edit-role-type">Role type</label>
          <select
            id="edit-role-type"
            value={roleType}
            onChange={(e) => setRoleType(e.target.value)}
            className={inputClass}
          >
            <option value="Lead">Lead</option>
            <option value="Supporting">Supporting</option>
            <option value="Guest">Guest</option>
            <option value="Background">Background</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-playing-age">Playing age</label>
          <input
            id="edit-playing-age"
            value={playingAge}
            onChange={(e) => setPlayingAge(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="edit-gender">Gender</label>
          <input
            id="edit-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-pay-rate">Pay rate</label>
          <input
            id="edit-pay-rate"
            value={compensation}
            onChange={(e) => setCompensation(e.target.value)}
            placeholder="SAG Scale"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <span className={labelClass}>Ethnicity</span>
        <p className="text-xs text-text-secondary mb-2">Select all that apply</p>
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
        <label className={labelClass} htmlFor="edit-description">Role description</label>
        <textarea
          id="edit-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="edit-audition-instructions">
          Audition instructions
        </label>
        <textarea
          id="edit-audition-instructions"
          rows={3}
          value={auditionInstructions}
          onChange={(e) => setAuditionInstructions(e.target.value)}
          placeholder="What should actors submit?"
          className={inputClass}
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-text-primary">Audition materials</p>

        {existingFiles.length > 0 && (
          <ul className="space-y-1.5">
            {existingFiles.map((file) => (
              <li
                key={file.fileName}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-bg-primary px-3 py-2"
              >
                <span className="text-xs text-text-primary truncate flex-1 min-w-0">
                  {file.label}: {file.fileName}
                </span>
                <button
                  type="button"
                  onClick={() => removeExistingFile(file.fileName)}
                  className="text-text-secondary hover:text-text-primary shrink-0"
                  aria-label={`Remove ${file.fileName}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <MaterialUploadField
          id={`edit-script-upload-${role.id}`}
          label="Script"
          description=""
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          icon={<FileText className="h-3.5 w-3.5" />}
          files={scriptFiles}
          onAdd={(files) => addFiles(files, setScriptFiles)}
          onRemove={(id) => removeNewFile(id, setScriptFiles)}
        />

        <MaterialUploadField
          id={`edit-reference-photo-upload-${role.id}`}
          label="Reference photos"
          description=""
          accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
          icon={<ImageIcon className="h-3.5 w-3.5" />}
          files={referencePhotoFiles}
          onAdd={(files) => addFiles(files, setReferencePhotoFiles, true)}
          onRemove={(id) => removeNewFile(id, setReferencePhotoFiles)}
          showImagePreview
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="secondary" size="sm" className="h-8 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
