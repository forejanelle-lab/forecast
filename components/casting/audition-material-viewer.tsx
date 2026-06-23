"use client";

import {
  createPlaceholderBlob,
  downloadBlob,
  getSubmissionFile,
} from "@/lib/audition-submission-files-storage";
import { getMediaFileKind } from "@/lib/media-file-kind";
import { cn } from "@/lib/utils";
import {
  Download,
  FileAudio,
  FileText,
  FileVideo,
  ImageIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface AuditionMaterialViewerProps {
  auditionId: string;
  label: string;
  fileName: string;
  fileUrl?: string;
  onClose: () => void;
  className?: string;
}

function kindIcon(kind: ReturnType<typeof getMediaFileKind>) {
  if (kind === "video") return <FileVideo className="h-8 w-8" />;
  if (kind === "image") return <ImageIcon className="h-8 w-8" />;
  if (kind === "audio") return <FileAudio className="h-8 w-8" />;
  return <FileText className="h-8 w-8" />;
}

function isDirectMediaUrl(url: string): boolean {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  );
}

export function AuditionMaterialViewer({
  auditionId,
  label,
  fileName,
  fileUrl,
  onClose,
  className,
}: AuditionMaterialViewerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const kind = getMediaFileKind(fileName);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (fileUrl && isDirectMediaUrl(fileUrl)) {
        setPreviewUrl(fileUrl);
        setBlob(null);
        if (kind === "document" && fileUrl.startsWith("data:text")) {
          try {
            const text = decodeURIComponent(fileUrl.split(",")[1] ?? "");
            if (!cancelled) setTextPreview(text);
          } catch {
            if (!cancelled) setTextPreview(null);
          }
        } else {
          setTextPreview(null);
        }
        if (!cancelled) setLoading(false);
        return;
      }

      const stored = await getSubmissionFile(auditionId, fileName);
      const fileBlob = stored ?? createPlaceholderBlob(label, fileName);
      if (cancelled) return;

      objectUrl = URL.createObjectURL(fileBlob);
      setBlob(fileBlob);
      setPreviewUrl(objectUrl);

      if (kind === "document" || fileBlob.type.startsWith("text/")) {
        const text = await fileBlob.text();
        if (!cancelled) setTextPreview(text);
      } else {
        setTextPreview(null);
      }

      if (!cancelled) setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [auditionId, fileName, fileUrl, label, kind]);

  const handleDownload = useCallback(async () => {
    if (fileUrl && isDirectMediaUrl(fileUrl)) {
      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.download = fileName;
      anchor.click();
      return;
    }

    const stored = await getSubmissionFile(auditionId, fileName);
    const fileBlob = stored ?? blob ?? createPlaceholderBlob(label, fileName);
    const downloadName = stored
      ? fileName
      : `${fileName.replace(/\.[^.]+$/, "") || fileName}.txt`;
    downloadBlob(fileBlob, downloadName);
  }, [auditionId, fileName, fileUrl, label, blob]);

  const canPreviewVideo = kind === "video" && previewUrl;
  const canPreviewImage = kind === "image" && previewUrl;
  const canPreviewAudio = kind === "audio" && previewUrl;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-bg-primary overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border/60 bg-bg-sidebar/40">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{label}</p>
          <p className="text-xs text-text-secondary truncate">{fileName}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handleDownload()}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors"
            aria-label={`Download ${label}`}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors"
            aria-label="Close preview"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-xs text-text-secondary">
            Loading preview...
          </div>
        ) : canPreviewVideo ? (
          <video
            src={previewUrl}
            controls
            className="w-full max-h-[320px] rounded-lg bg-black"
            playsInline
          >
            <track kind="captions" />
          </video>
        ) : canPreviewImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob/data preview URL
          <img
            src={previewUrl!}
            alt={label}
            className="w-full max-h-[320px] rounded-lg object-contain bg-bg-sidebar"
          />
        ) : canPreviewAudio ? (
          <audio src={previewUrl} controls className="w-full" />
        ) : kind === "document" && textPreview ? (
          <pre
            className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap rounded-lg bg-bg-sidebar/60 px-3 py-3 max-h-[320px] overflow-y-auto"
          >
            {textPreview}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-text-secondary">
            {kindIcon(kind)}
            <p className="text-sm font-medium text-text-primary">{label}</p>
            <p className="text-xs text-center max-w-xs">
              Preview is not available for this file type. Download to view the file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export async function downloadAuditionMaterial(
  auditionId: string,
  label: string,
  fileName: string,
  fileUrl?: string,
) {
  if (fileUrl && isDirectMediaUrl(fileUrl)) {
    const anchor = document.createElement("a");
    anchor.href = fileUrl;
    anchor.download = fileName;
    anchor.click();
    return;
  }

  const stored = await getSubmissionFile(auditionId, fileName);
  const fileBlob = stored ?? createPlaceholderBlob(label, fileName);
  const downloadName = stored
    ? fileName
    : `${fileName.replace(/\.[^.]+$/, "") || fileName}.txt`;
  downloadBlob(fileBlob, downloadName);
}
