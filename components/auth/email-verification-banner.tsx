"use client";

import { Button } from "@/components/ui/button";
import { Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function EmailVerificationBanner({
  email,
  className,
}: {
  email: string;
  className?: string;
}) {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  async function handleResend() {
    setResendLoading(true);
    setResendMessage("");
    setResendError("");

    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setResendError(data.error ?? "Could not send email. Try again.");
        setResendLoading(false);
        return;
      }

      setResendMessage(data.message ?? "Verification email sent.");
      setResendLoading(false);
    } catch {
      setResendError("Something went wrong. Please try again.");
      setResendLoading(false);
    }
  }

  return (
    <div
      className={`rounded-[20px] border border-accent/25 bg-gradient-to-r from-accent/8 via-bg-secondary to-violet-500/5 px-4 py-3.5 sm:px-5 shadow-[var(--shadow-soft)] ${className ?? ""}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/20">
            <Mail className="h-4 w-4 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
              Verify your email
              <ShieldCheck className="h-3.5 w-3.5 text-text-secondary hidden sm:inline" />
            </p>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              Confirm{" "}
              <span className="font-medium text-text-primary">{email}</span> to secure
              your account and receive casting updates. You can complete onboarding
              without verifying.
            </p>
            {resendMessage && (
              <p className="text-xs text-success mt-1.5">{resendMessage}</p>
            )}
            {resendError && (
              <p className="text-xs text-danger mt-1.5">{resendError}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            disabled={resendLoading}
            onClick={handleResend}
          >
            {resendLoading ? "Sending..." : "Resend email"}
          </Button>
          <Link
            href="/auth/verify-email"
            className="inline-flex h-8 items-center justify-center rounded-xl px-4 text-xs font-semibold bg-gradient-to-r from-[#c8a86b] via-[#d4b87a] to-[#b58d4b] text-text-primary border border-accent/30 hover:brightness-105 transition-all"
          >
            Verify now
          </Link>
        </div>
      </div>
    </div>
  );
}
