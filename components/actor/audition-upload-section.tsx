"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuditionSubmissions } from "@/components/providers/audition-submissions-provider";
import { isAuditionOpenForSubmission } from "@/lib/audition-status";
import type { Audition } from "@/types";
import {
  createPlaceholderBlob,
  downloadBlob,
  getSubmissionFile,
  saveSubmissionFiles,
} from "@/lib/audition-submission-files-storage";
import { fileToDataUrl } from "@/lib/actor-profile-storage";
import { FileVideo, Download, Plus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/utils";

interface UploadItem {
  id: string;
  file: File;
  label: string;
}

interface AuditionUploadSectionProps {
  audition: Audition;
}

export function AuditionUploadSection({ audition }: AuditionUploadSectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const { getSubmission, isSubmitted, submitAudition } = useAuditionSubmissions();

  const submitted = isSubmitted(audition.id, audition.status);
  const submission = getSubmission(audition.id);
  const canSubmit = isAuditionOpenForSubmission(audition);

  const handleDownload = async (label: string, fileName: string) => {
    const stored = await getSubmissionFile(audition.id, fileName);
    const blob = stored ?? createPlaceholderBlob(label, fileName);
    const downloadName = stored
      ? fileName
      : `${fileName.replace(/\.[^.]+$/, "") || fileName}.txt`;
    downloadBlob(blob, downloadName);
  };

  if (audition.status === "declined" || audition.status === "withdrawn") return null;

  if (submitted && submission) {
    return (
      <Card padding="sm">
        <CardHeader className="mb-2">
          <CardTitle className="text-sm">Submitted Material</CardTitle>
          <Upload className="h-3.5 w-3.5 text-text-secondary" />
        </CardHeader>
        <p className="text-xs text-text-secondary mb-2">
          Submitted {formatDateTime(submission.submittedAt)}
        </p>
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
          {submission.items.map((item) => (
            <li
              key={`${item.label}-${item.fileName}`}
              className="flex items-center gap-2.5 px-3 py-2"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-sidebar text-text-secondary">
                <FileVideo className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                <p className="text-xs text-text-secondary truncate">{item.fileName}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(item.label, item.fileName)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors"
                aria-label={`Download ${item.label}`}
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  if (audition.status !== "requested") return null;

  if (!canSubmit) return null;

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const newItems = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      label: "",
    }));
    setUploads((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((item) => item.id !== id));
  };

  const updateLabel = (id: string, label: string) => {
    setUploads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, label } : item)),
    );
  };

  const canSubmitUpload =
    uploads.length > 0 && uploads.every((item) => item.label.trim().length > 0);

  const handleSubmit = async () => {
    const items = await Promise.all(
      uploads.map(async (item) => ({
        fileName: item.file.name,
        label: item.label.trim(),
        fileUrl: await fileToDataUrl(item.file),
      })),
    );

    await saveSubmissionFiles(
      audition.id,
      uploads.map((item) => ({ fileName: item.file.name, file: item.file })),
    );

    try {
      const response = await fetch(`/api/auditions/${audition.id}/submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) {
        console.error("Failed to persist audition submission to server");
        return;
      }

      submitAudition(audition.id, items);
      setUploads([]);
      router.refresh();
    } catch (error) {
      console.error("Failed to persist audition submission:", error);
    }
  };

  return (
    <Card padding="sm">
      <CardHeader className="mb-2">
        <CardTitle className="text-sm">Upload Audition Material</CardTitle>
        <Upload className="h-3.5 w-3.5 text-text-secondary" />
      </CardHeader>

      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,audio/*,image/*,.mp4,.mov,.mp3,.wav,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />

        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/60 bg-bg-sidebar/50 p-2.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-text-primary truncate min-w-0">
                    {item.file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeUpload(item.id)}
                    className="text-text-secondary hover:text-text-primary shrink-0"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateLabel(item.id, e.target.value)}
                  placeholder="Label (e.g. Scene 3, Headshot, Slate)"
                  className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-text-secondary hover:border-accent/50 hover:bg-bg-sidebar/50 hover:text-text-primary transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add file
        </button>

        <Button
          size="sm"
          className="w-full"
          disabled={!canSubmitUpload}
          onClick={handleSubmit}
        >
          Submit Audition Material
        </Button>
      </div>
    </Card>
  );
}
