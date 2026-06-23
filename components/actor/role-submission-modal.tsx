"use client";

import { Button } from "@/components/ui/button";
import { PreviewImage } from "@/components/ui/preview-image";
import { readStoredActorSettings } from "@/lib/actor-settings-storage";
import { formatRoleMetaLine } from "@/lib/role-display";
import { useMounted } from "@/lib/use-mounted";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";
import { Film, Image as ImageIcon, Mic, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SubmissionHeadshot {
  id: string;
  label: string;
  initials: string;
  previewUrl?: string;
  fileName: string;
  featured?: boolean;
}

interface SubmissionMedia {
  id: string;
  label: string;
  type: "video" | "audio" | "image" | "document";
  previewUrl?: string;
  fileName: string;
  duration?: string;
}

interface RoleSubmissionModalProps {
  role: Role;
  projectTitle: string;
  acceptsSubmissions: boolean;
  hasApplied?: boolean;
  hasAudition?: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

function submissionFileUrl(url: string | undefined): string | undefined {
  if (!url || url.startsWith("blob:")) return undefined;
  return url;
}

function displayPreviewUrl(localUrl?: string, remoteUrl?: string): string | undefined {
  if (localUrl && (localUrl.startsWith("blob:") || localUrl.startsWith("data:"))) {
    return localUrl;
  }
  return localUrl || remoteUrl || undefined;
}

function mapLocalHeadshots(): SubmissionHeadshot[] {
  const settings = readStoredActorSettings();
  return settings.headshots.map((h) => ({
    id: h.id,
    label: h.label,
    initials: h.label.slice(0, 2).toUpperCase(),
    previewUrl: h.previewUrl || undefined,
    fileName: h.fileName,
    featured: h.featured,
  }));
}

function mapLocalMedia(): SubmissionMedia[] {
  const settings = readStoredActorSettings();
  return [...settings.materials, ...settings.videos].map((m) => ({
    id: m.id,
    label: m.label,
    type: m.type,
    previewUrl: m.previewUrl,
    fileName: m.fileName,
  }));
}

function mergeHeadshots(
  apiHeadshots: SubmissionHeadshot[],
  localHeadshots: SubmissionHeadshot[],
): SubmissionHeadshot[] {
  const localById = new Map(localHeadshots.map((item) => [item.id, item]));
  const merged: SubmissionHeadshot[] = apiHeadshots.map((headshot) => {
    const local = localById.get(headshot.id);
    return {
      ...headshot,
      previewUrl: displayPreviewUrl(local?.previewUrl, headshot.previewUrl),
      fileName: local?.fileName || headshot.fileName,
    };
  });

  for (const local of localHeadshots) {
    if (!merged.some((headshot) => headshot.id === local.id)) {
      merged.push(local);
    }
  }

  return merged;
}

function mergeMedia(
  apiMedia: SubmissionMedia[],
  localMedia: SubmissionMedia[],
): SubmissionMedia[] {
  const localById = new Map(localMedia.map((item) => [item.id, item]));
  const merged: SubmissionMedia[] = apiMedia.map((item) => {
    const local = localById.get(item.id);
    return {
      ...item,
      previewUrl: displayPreviewUrl(local?.previewUrl, item.previewUrl),
      fileName: local?.fileName || item.fileName,
    };
  });

  for (const local of localMedia) {
    if (!merged.some((item) => item.id === local.id)) {
      merged.push(local);
    }
  }

  return merged;
}

export function RoleSubmissionModal({
  role,
  projectTitle,
  acceptsSubmissions,
  hasApplied = false,
  hasAudition = false,
  onClose,
  onSubmitted,
}: RoleSubmissionModalProps) {
  const mounted = useMounted();
  const [selectedHeadshot, setSelectedHeadshot] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actorHeadshots, setActorHeadshots] = useState<SubmissionHeadshot[]>([]);
  const [actorMedia, setActorMedia] = useState<SubmissionMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSubmissionMedia() {
      const localHeadshots = mapLocalHeadshots();
      const localMedia = mapLocalMedia();

      try {
        const response = await fetch("/api/actor/profile");
        if (!response.ok) throw new Error("profile fetch failed");

        const result = (await response.json()) as {
          profile?: {
            headshots?: {
              id: string;
              label: string;
              initials?: string;
              previewUrl?: string;
              fileName?: string;
              featured?: boolean;
            }[];
            media?: {
              id: string;
              label: string;
              type: SubmissionMedia["type"];
              previewUrl?: string;
              fileName?: string;
            }[];
            profilePhotoUrl?: string | null;
          };
        };

        if (cancelled) return;

        const profile = result.profile;
        const apiHeadshots: SubmissionHeadshot[] = (profile?.headshots ?? []).map(
          (headshot) => ({
            id: headshot.id,
            label: headshot.label,
            initials: (headshot.initials ?? headshot.label).slice(0, 2).toUpperCase(),
            previewUrl: headshot.previewUrl,
            fileName: headshot.fileName ?? "",
            featured: headshot.featured,
          }),
        );

        if (apiHeadshots.length === 0 && profile?.profilePhotoUrl) {
          apiHeadshots.push({
            id: "profile-photo",
            label: "Profile Photo",
            initials: "PP",
            previewUrl: profile.profilePhotoUrl,
            fileName: "profile-photo",
            featured: true,
          });
        }

        const apiMedia: SubmissionMedia[] = (profile?.media ?? []).map((item) => ({
          id: item.id,
          label: item.label,
          type: item.type,
          previewUrl: item.previewUrl,
          fileName: item.fileName ?? "",
        }));

        setActorHeadshots(mergeHeadshots(apiHeadshots, localHeadshots));
        setActorMedia(mergeMedia(apiMedia, localMedia));
      } catch {
        if (!cancelled) {
          setActorHeadshots(localHeadshots);
          setActorMedia(localMedia);
        }
      } finally {
        if (!cancelled) setMediaLoading(false);
      }
    }

    loadSubmissionMedia();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setSelectedHeadshot(null);
    setSelectedMedia(null);
    setNote("");
    setSubmitted(false);
    setSubmitting(false);
    setError(null);
  };

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose]);

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

  const selectHeadshot = (id: string) => {
    setSelectedHeadshot((prev) => (prev === id ? null : id));
  };

  const selectMedia = (id: string) => {
    setSelectedMedia((prev) => (prev === id ? null : id));
  };

  const handleSubmit = async () => {
    if (!selectedHeadshot || submitting || hasApplied || hasAudition) return;

    const headshot = actorHeadshots.find((item) => item.id === selectedHeadshot);
    if (!headshot) {
      setError("Please select a headshot.");
      return;
    }

    const items: {
      label: string;
      fileName: string;
      fileUrl?: string;
      fileType?: string;
    }[] = [
      {
        label: headshot.label,
        fileName: headshot.fileName,
        fileUrl: submissionFileUrl(headshot.previewUrl),
        fileType: "image",
      },
    ];

    if (selectedMedia) {
      const media = actorMedia.find((item) => item.id === selectedMedia);
      if (media) {
        items.push({
          label: media.label,
          fileName: media.fileName,
          fileUrl: submissionFileUrl(media.previewUrl),
          fileType: media.type,
        });
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: role.id,
          note: note.trim() || undefined,
          items,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Failed to submit application.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      onSubmitted?.();
      setTimeout(() => handleClose(), 1200);
    } catch {
      setError("Failed to submit application. Please try again.");
      setSubmitting(false);
    }
  };

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
          aria-labelledby="submission-modal-title"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 px-6 py-5 border-b border-border/60">
            <div className="min-w-0 flex-1">
              <h2
                id="submission-modal-title"
                className="text-base font-semibold text-text-primary"
              >
                Submit for {role.characterName}
              </h2>
              <p className="text-xs text-text-secondary mt-1">{projectTitle}</p>
              <p className="text-xs text-text-secondary mt-1">
                {formatRoleMetaLine(role)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {submitted ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm font-medium text-text-primary">
                  Application submitted to casting.
                </p>
              </div>
            ) : !acceptsSubmissions ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm font-medium text-text-primary">
                  This role is not accepting submissions.
                </p>
                <p className="text-sm text-text-secondary mt-2">
                  Casting has closed submissions for this role. Check back later or explore
                  other roles on the project.
                </p>
              </div>
            ) : hasAudition ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm font-medium text-text-primary">
                  Audition already on this role
                </p>
                <p className="text-sm text-text-secondary mt-2">
                  You have an audition request for this role. View it from Auditions or
                  Submissions.
                </p>
              </div>
            ) : hasApplied ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm font-medium text-text-primary">
                  Application already submitted
                </p>
                <p className="text-sm text-text-secondary mt-2">
                  You have already applied to this role. View your submission from the
                  Submissions page.
                </p>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-5">
                {error && (
                  <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                    {error}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                    Select headshot <span className="normal-case">(required)</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {mediaLoading ? (
                      <p className="text-xs text-text-secondary col-span-3">
                        Loading headshots...
                      </p>
                    ) : actorHeadshots.length === 0 ? (
                      <p className="text-xs text-text-secondary col-span-3">
                        Add headshots on your profile to submit applications.
                      </p>
                    ) : (
                      actorHeadshots.map((headshot) => {
                        const selected = selectedHeadshot === headshot.id;
                        return (
                          <button
                            key={headshot.id}
                            type="button"
                            onClick={() => selectHeadshot(headshot.id)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-colors",
                              selected
                                ? "border-accent bg-accent/10"
                                : "border-border/60 hover:border-border hover:bg-bg-sidebar/50",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-20 w-20 items-center justify-center rounded-lg overflow-hidden text-sm font-bold shrink-0",
                                selected
                                  ? "bg-accent text-white"
                                  : "bg-gradient-to-br from-accent/30 to-accent/10 text-accent-hover",
                              )}
                            >
                              {headshot.previewUrl ? (
                                <PreviewImage
                                  src={headshot.previewUrl}
                                  alt={headshot.label}
                                  width={80}
                                  height={80}
                                  className="h-20 w-20 object-cover"
                                />
                              ) : (
                                headshot.initials
                              )}
                            </div>
                            <span className="text-[11px] text-text-secondary text-center leading-tight line-clamp-2">
                              {headshot.label}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                    Select media <span className="normal-case">(optional)</span>
                  </p>
                  <div className="space-y-2">
                    {actorMedia.map((item) => {
                      const selected = selectedMedia === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectMedia(item.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                            selected
                              ? "border-accent bg-accent/10"
                              : "border-border/60 hover:border-border hover:bg-bg-sidebar/50",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden",
                              selected
                                ? "bg-accent text-white"
                                : "bg-bg-sidebar text-text-secondary",
                            )}
                          >
                            {item.type === "image" && item.previewUrl ? (
                              <PreviewImage
                                src={item.previewUrl}
                                alt={item.label}
                                width={32}
                                height={32}
                                className="h-8 w-8 object-cover"
                              />
                            ) : item.type === "video" ? (
                              <Film className="h-3.5 w-3.5" />
                            ) : item.type === "audio" ? (
                              <Mic className="h-3.5 w-3.5" />
                            ) : (
                              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {item.label}
                            </p>
                            {item.duration && (
                              <p className="text-xs text-text-secondary">{item.duration}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="casting-note"
                    className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block"
                  >
                    Note to casting
                  </label>
                  <textarea
                    id="casting-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a brief note for the casting director..."
                    rows={3}
                    className="w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {!submitted && acceptsSubmissions && !hasApplied && !hasAudition && (
            <div className="flex shrink-0 gap-3 px-6 py-4 border-t border-border/60 bg-bg-primary/50">
              <Button variant="secondary" size="sm" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSubmit}
                disabled={!selectedHeadshot || submitting}
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
