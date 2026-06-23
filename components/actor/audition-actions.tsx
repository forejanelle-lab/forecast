"use client";

import { Button } from "@/components/ui/button";
import { useAuditionSubmissions } from "@/components/providers/audition-submissions-provider";
import { useMounted } from "@/lib/use-mounted";
import type { AuditionStatus } from "@/types";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface AuditionActionsProps {
  auditionId: string;
  status: AuditionStatus;
  canAct?: boolean;
}

export function AuditionActions({
  auditionId,
  status,
  canAct,
}: AuditionActionsProps) {
  const mounted = useMounted();
  const router = useRouter();
  const { isSubmitted } = useAuditionSubmissions();
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [withdrew, setWithdrew] = useState(status === "withdrawn");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hasSubmitted = isSubmitted(auditionId, status);
  const isActionable =
    (canAct ?? status === "requested") && !hasSubmitted && status !== "withdrawn";

  const closeDeclineModal = useCallback(() => {
    if (submitting) return;
    setShowDeclineModal(false);
    setDeclineReason("");
    setError("");
  }, [submitting]);

  useEffect(() => {
    if (!showDeclineModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDeclineModal();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showDeclineModal, closeDeclineModal]);

  async function confirmDecline() {
    const reason = declineReason.trim();
    if (!reason) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/auditions/${auditionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "withdrawn", notes: reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to decline audition. Please try again.");
        setSubmitting(false);
        return;
      }

      closeDeclineModal();
      setWithdrew(true);
      router.refresh();
    } catch (declineError) {
      console.error("Failed to decline audition:", declineError);
      setError("Failed to decline audition. Please try again.");
      setSubmitting(false);
    }
  }

  if (withdrew || status === "withdrawn") {
    return (
      <p className="text-xs text-text-secondary">
        Audition withdrawn. Casting has been notified.
      </p>
    );
  }

  if (!isActionable) return null;

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowDeclineModal(true)}
      >
        Decline
      </Button>

      {showDeclineModal &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain">
            <button
              type="button"
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeDeclineModal}
              aria-label="Close decline audition"
            />
            <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
              <div
                className="relative w-full max-w-md rounded-[20px] bg-bg-secondary border border-border/60 shadow-[var(--shadow-card)] animate-fade-in overflow-hidden my-4 sm:my-8"
                role="dialog"
                aria-modal="true"
                aria-labelledby="decline-modal-title"
              >
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border/60">
                  <div>
                    <h2
                      id="decline-modal-title"
                      className="text-sm font-semibold text-text-primary"
                    >
                      Decline audition
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Let casting know why you&apos;re passing on this request.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDeclineModal}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-sidebar transition-colors shrink-0"
                    aria-label="Close"
                    disabled={submitting}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="px-5 py-4">
                  <label
                    htmlFor="decline-reason"
                    className="text-xs font-medium text-text-secondary mb-2 block"
                  >
                    Why are you declining?
                  </label>
                  <textarea
                    id="decline-reason"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="e.g. Scheduling conflict, role isn't right for me..."
                    rows={3}
                    disabled={submitting}
                    className="w-full rounded-xl border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-none disabled:opacity-60"
                  />
                  {error && <p className="text-xs text-danger mt-2">{error}</p>}
                </div>
                <div className="flex gap-2 px-5 py-3 border-t border-border/60 bg-bg-primary/50">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={closeDeclineModal}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={confirmDecline}
                    disabled={!declineReason.trim() || submitting}
                  >
                    {submitting ? "Declining…" : "Confirm Decline"}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
