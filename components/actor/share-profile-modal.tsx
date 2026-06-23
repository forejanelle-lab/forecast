"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ShareProfileModalProps {
  actorName: string;
  profileUrl: string;
  onClose: () => void;
}

function buildMailtoLink(
  recipient: string,
  actorName: string,
  profileUrl: string,
  note: string,
): string {
  const subject = `${actorName}'s Fore Cast profile`;
  const bodyLines = [
    "Hi,",
    "",
    `I'd like to share my actor profile with you on Fore Cast:`,
    profileUrl,
  ];

  if (note.trim()) {
    bodyLines.push("", note.trim());
  }

  bodyLines.push("", "Best,", actorName);

  const params = new URLSearchParams({
    subject,
    body: bodyLines.join("\n"),
  });

  return `mailto:${recipient}?${params.toString()}`;
}

export function ShareProfileModal({
  actorName,
  profileUrl,
  onClose,
}: ShareProfileModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [note, setNote] = useState("");

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const trimmedEmail = recipientEmail.trim();
  const canSend = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  const handleSend = () => {
    if (!canSend) return;
    window.location.href = buildMailtoLink(trimmedEmail, actorName, profileUrl, note);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
        aria-labelledby="share-profile-title"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border/60">
          <div>
            <h2
              id="share-profile-title"
              className="text-base font-semibold text-text-primary"
            >
              Share profile
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Send your profile link by email
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label
              className="text-[10px] font-medium text-text-secondary mb-1 block"
              htmlFor="share-profile-email"
            >
              Recipient email
            </label>
            <Input
              id="share-profile-email"
              type="email"
              placeholder="casting@studio.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label
              className="text-[10px] font-medium text-text-secondary mb-1 block"
              htmlFor="share-profile-note"
            >
              Personal note (optional)
            </label>
            <textarea
              id="share-profile-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a short message for the recipient…"
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-none"
            />
          </div>

          <div className="rounded-lg border border-border/60 bg-bg-sidebar/40 px-3 py-2">
            <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide mb-1">
              Profile link
            </p>
            <p className="text-xs text-text-primary break-all">{profileUrl}</p>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border/60 bg-bg-primary/50">
          <Button variant="secondary" size="sm" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleSend}
            disabled={!canSend}
          >
            <Mail className="h-3.5 w-3.5" />
            Send email
          </Button>
        </div>
      </div>
    </div>
  );
}
