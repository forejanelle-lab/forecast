"use client";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/lib/use-mounted";
import type { RoleAuditionFile, RoleAuditionPackage } from "@/types";
import { cn } from "@/lib/utils";
import {
  getTodayDateString,
  isAuditionDeadlineInPast,
} from "@/lib/audition-utils";
import {
  FileAudio,
  FileText,
  FileVideo,
  ImageIcon,
  Send,
  X,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

function fileIcon(type: RoleAuditionFile["type"]) {
  if (type === "video") return <FileVideo className="h-3.5 w-3.5" />;
  if (type === "audio") return <FileAudio className="h-3.5 w-3.5" />;
  if (type === "image") return <ImageIcon className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

interface AuditionRequestModalProps {
  actorName: string;
  auditionPackage: RoleAuditionPackage;
  message: string;
  deadline: string;
  onMessageChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
  sending?: boolean;
  error?: string | null;
}

export function AuditionRequestModal({
  actorName,
  auditionPackage,
  message,
  deadline,
  onMessageChange,
  onDeadlineChange,
  onSend,
  onClose,
  sending = false,
  error = null,
}: AuditionRequestModalProps) {
  const mounted = useMounted();
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

  if (!mounted) return null;

  const minDeadline = getTodayDateString();
  const deadlineInPast = isAuditionDeadlineInPast(deadline);

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
          className="relative flex w-full max-w-2xl max-h-[calc(100dvh-2rem)] my-4 sm:my-8 flex-col rounded-[20px] bg-bg-secondary border border-border/60 shadow-[var(--shadow-card)] animate-fade-in overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audition-request-title"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 px-6 py-5 border-b border-border/60">
            <div>
              <h2
                id="audition-request-title"
                className="text-base font-semibold text-text-primary"
              >
                Send audition request
              </h2>
              <p className="text-sm text-text-secondary mt-0.5">
                Review instructions and message for {actorName}.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors shrink-0"
              aria-label="Close audition request"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
            <div>
              <label
                className="text-[10px] font-medium text-text-secondary mb-1 block"
                htmlFor="audition-deadline"
              >
                Audition deadline
              </label>
              <input
                id="audition-deadline"
                type="date"
                value={deadline}
                min={minDeadline}
                onChange={(e) => onDeadlineChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
              />
              {deadlineInPast && (
                <p className="text-xs text-danger mt-2">
                  Audition deadline cannot be in the past.
                </p>
              )}
            </div>

            <div>
              <label
                className="text-[10px] font-medium text-text-secondary mb-1 block"
                htmlFor="audition-message"
              >
                Message to actor
              </label>
              <textarea
                id="audition-message"
                rows={6}
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
              />
              {error && <p className="text-xs text-danger mt-2">{error}</p>}
            </div>

            <div>
              <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Audition materials
              </p>
              {auditionPackage.files.length > 0 ? (
                <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
                  {auditionPackage.files.map((file) => (
                    <li
                      key={`${file.label}-${file.fileName}`}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-sidebar text-text-secondary",
                        )}
                      >
                        {fileIcon(file.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary">{file.label}</p>
                        <p className="text-xs text-text-secondary truncate">{file.fileName}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-secondary rounded-lg border border-border/60 bg-bg-primary/50 px-4 py-3">
                  No materials attached for this role.
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Upload requirements
              </p>
              <ul className="space-y-1.5">
                {auditionPackage.uploadRequirements.map((req) => (
                  <li key={req} className="text-sm text-text-secondary flex gap-2">
                    <span className="text-accent shrink-0">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex shrink-0 gap-3 px-6 py-4 border-t border-border/60 bg-bg-primary/50">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={handleClose}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={onSend}
              disabled={sending || deadlineInPast}
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Sending..." : "Send audition request"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
