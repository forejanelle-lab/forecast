"use client";

import { Button } from "@/components/ui/button";
import { CASTING_ACTOR_MESSAGE_PLACEHOLDER } from "@/lib/casting-actor-message-template";
import { formatDate } from "@/lib/utils";
import { Send, X } from "lucide-react";
import { useCallback, useEffect } from "react";

interface CastingActorMessageModalProps {
  actorName: string;
  roleName: string;
  projectTitle: string;
  submissionDeadline: string;
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
  disabled?: boolean;
  disabledReason?: string | null;
}

export function CastingActorMessageModal({
  actorName,
  roleName,
  projectTitle,
  submissionDeadline,
  message,
  onMessageChange,
  onSend,
  onClose,
  disabled = false,
  disabledReason,
}: CastingActorMessageModalProps) {
  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close"
      />
      <div
        className="relative w-full max-w-lg rounded-[20px] bg-bg-secondary border border-border/60 shadow-[var(--shadow-card)] animate-fade-in overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="casting-actor-message-title"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border/60">
          <div>
            <h2
              id="casting-actor-message-title"
              className="text-base font-semibold text-text-primary"
            >
              Message {actorName}
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {roleName} · {projectTitle}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Actors can reply after you send the first message, but not after the casting end date
              {submissionDeadline ? ` (${formatDate(submissionDeadline)})` : ""}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors"
            aria-label="Close message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {disabled && disabledReason && (
            <p className="text-xs text-text-secondary rounded-lg border border-border/60 bg-bg-primary/50 px-3 py-2">
              {disabledReason}
            </p>
          )}
          <div>
            <label
              className="text-[10px] font-medium text-text-secondary mb-1 block"
              htmlFor="casting-actor-message"
            >
              Message to actor
            </label>
            <textarea
              id="casting-actor-message"
              rows={10}
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              disabled={disabled}
              placeholder={CASTING_ACTOR_MESSAGE_PLACEHOLDER}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border/60 bg-bg-primary/50">
          <Button variant="secondary" size="sm" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={onSend}
            disabled={disabled || !message.trim()}
          >
            <Send className="h-3.5 w-3.5" />
            Send message
          </Button>
        </div>
      </div>
    </div>
  );
}
