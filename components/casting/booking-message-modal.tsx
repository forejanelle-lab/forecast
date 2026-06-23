"use client";

import { Button } from "@/components/ui/button";
import { BOOKING_MESSAGE_PLACEHOLDER } from "@/lib/booking-message-template";
import { useMounted } from "@/lib/use-mounted";
import { Send, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

interface BookingMessageModalProps {
  actorName: string;
  characterName: string;
  projectTitle: string;
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
  sending?: boolean;
  error?: string | null;
}

export function BookingMessageModal({
  actorName,
  characterName,
  projectTitle,
  message,
  onMessageChange,
  onSend,
  onClose,
  sending = false,
  error = null,
}: BookingMessageModalProps) {
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

  return createPortal(
    <div className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain">
      <button
        type="button"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close"
      />
      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="relative w-full max-w-lg rounded-[20px] bg-bg-secondary border border-border/60 shadow-[var(--shadow-card)] animate-fade-in overflow-hidden my-4 sm:my-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-message-title"
        >
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border/60">
            <div>
              <h2
                id="booking-message-title"
                className="text-base font-semibold text-text-primary"
              >
                Book {actorName}
              </h2>
              <p className="text-sm text-text-secondary mt-0.5">
                {characterName} · {projectTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors shrink-0"
              aria-label="Close booking message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-3">
            <p className="text-sm text-text-secondary">
              Send a congratulations message to {actorName} to confirm the booking.
            </p>
            <div>
              <label
                className="text-[10px] font-medium text-text-secondary mb-1 block"
                htmlFor="booking-message"
              >
                Message to actor
              </label>
              <textarea
                id="booking-message"
                rows={12}
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder={BOOKING_MESSAGE_PLACEHOLDER}
                className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
              />
            </div>
          </div>

          {error && (
            <p className="px-6 text-xs text-danger leading-snug">{error}</p>
          )}

          <div className="flex gap-3 px-6 py-4 border-t border-border/60 bg-bg-primary/50">
            <Button variant="secondary" size="sm" className="flex-1" onClick={handleClose} disabled={sending}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={onSend}
              disabled={!message.trim() || sending}
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Sending..." : "Send & book actor"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
