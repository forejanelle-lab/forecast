"use client";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Clapperboard } from "lucide-react";
import Link from "next/link";
import { useMounted } from "@/lib/use-mounted";
import { createPortal } from "react-dom";

export type AuditionCelebrationData = {
  id: string;
  roleName: string;
  projectTitle: string;
  deadline?: string;
  castingDirector: string;
};

interface AuditionCelebrationProps {
  audition: AuditionCelebrationData;
  requestedCount: number;
  onDismiss: () => void;
}

export function AuditionCelebration({
  audition,
  requestedCount,
  onDismiss,
}: AuditionCelebrationProps) {
  const mounted = useMounted();

  if (!mounted) return null;

  const requestMessage = `${audition.castingDirector} requested you to audition for ${audition.roleName} in ${audition.projectTitle}.`;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 audition-spotlight-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audition-celebration-title"
    >
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      <div className="audition-spotlight-beam" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="audition-spotlight-card rounded-2xl border border-accent/40 bg-bg-secondary px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/25">
              <Clapperboard className="h-6 w-6" />
            </div>
          </div>
          {requestedCount > 1 && (
            <p className="text-xs font-medium text-accent text-center mb-2">
              You have {requestedCount} new audition requests
            </p>
          )}
          <h2
            id="audition-celebration-title"
            className="text-base sm:text-lg font-semibold text-text-primary text-center tracking-tight leading-relaxed"
          >
            {requestMessage}
          </h2>
          {audition.deadline && (
            <p className="text-xs text-text-secondary text-center mt-3">
              Due {formatDate(audition.deadline)}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <Link href={`/actor/auditions/${audition.id}`} className="flex-1" onClick={onDismiss}>
              <Button type="button" className="w-full h-9 text-xs">
                View audition
              </Button>
            </Link>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 h-9 text-xs"
              onClick={onDismiss}
            >
              Got it
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
