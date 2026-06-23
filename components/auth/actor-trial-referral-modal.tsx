"use client";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/lib/use-mounted";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50";

const labelClass = "text-sm font-medium text-text-primary mb-1.5 block";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface ActorTrialReferralModalProps {
  userEmail: string;
  loading: boolean;
  error?: string;
  onConfirm: (referralName: string, referralEmail: string) => void;
}

export function ActorTrialReferralModal({
  userEmail,
  loading,
  error: externalError,
  onConfirm,
}: ActorTrialReferralModalProps) {
  const [referralName, setReferralName] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [error, setError] = useState("");
  const mounted = useMounted();

  const normalizedUserEmail = userEmail.trim().toLowerCase();
  const trimmedName = referralName.trim();
  const trimmedEmail = referralEmail.trim().toLowerCase();

  const canSubmit =
    trimmedName.length > 0 &&
    isValidEmail(trimmedEmail) &&
    trimmedEmail !== normalizedUserEmail;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!trimmedName) {
      setError("Please enter your fellow actor's name.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (trimmedEmail === normalizedUserEmail) {
      setError("Please refer another actor — you can't use your own email.");
      return;
    }

    onConfirm(trimmedName, trimmedEmail);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="relative flex min-h-full items-start justify-center p-4 sm:p-6 sm:items-center">
        <div
          className="relative w-full max-w-md my-4 sm:my-0 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[24px] bg-bg-secondary border border-accent/25 shadow-[var(--shadow-card)] animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trial-referral-title"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c8a86b] via-[#e8d5a8] to-[#b58d4b]" />

          <div className="p-6 sm:p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-fuchsia-500/15 border border-accent/20 mb-4">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>

          <h2
            id="trial-referral-title"
            className="text-xl font-bold tracking-tight text-text-primary mb-2"
          >
            Get 30 days of Premium free
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            Refer another actor to Fore Cast to unlock a{" "}
            <span className="font-medium text-text-primary">30-day free trial</span>{" "}
            of Premium before you enter your dashboard. This step is required to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || externalError) && (
              <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                {error || externalError}
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="referral-actor-name">
                Fellow actor&apos;s name
              </label>
              <input
                id="referral-actor-name"
                type="text"
                value={referralName}
                onChange={(e) => setReferralName(e.target.value)}
                placeholder="Jordan Blake"
                className={inputClass}
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="referral-actor-email">
                Fellow actor&apos;s email
              </label>
              <input
                id="referral-actor-email"
                type="email"
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
                placeholder="actor@example.com"
                className={inputClass}
                required
                autoComplete="email"
              />
            </div>

            <p className="text-xs text-text-secondary rounded-lg border border-border/60 bg-bg-sidebar/40 px-3 py-2.5 leading-relaxed">
              We&apos;ll send them an invite to join Fore Cast. Your Premium trial starts as
              soon as you continue to your dashboard.
            </p>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#c8a86b] via-[#d4b87a] to-[#b58d4b] text-text-primary font-semibold border border-accent/30"
              size="lg"
              disabled={!canSubmit || loading}
            >
              {loading ? "Starting trial..." : "Start 30-day free trial"}
            </Button>
          </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
