"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyEmailContentInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { data: session, update } = useSession();

  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "error">(
    token ? "verifying" : "idle",
  );
  const [message, setMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (!token) return;

    async function verify() {
      try {
        const res = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token!)}`,
        );
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error ?? "This verification link is invalid or has expired.");
          return;
        }

        setStatus("verified");
        setMessage(data.message ?? "Email verified successfully.");
        await update({ isEmailVerified: true });
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }

    verify();
  }, [token, update]);

  async function handleResend() {
    setResendError("");
    setResendMessage("");
    setResendLoading(true);

    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setResendError(data.error ?? "Something went wrong. Please try again.");
        setResendLoading(false);
        return;
      }

      setResendMessage(data.message ?? "Verification email sent. Check your inbox.");
      setResendLoading(false);
    } catch {
      setResendError("Something went wrong. Please try again.");
      setResendLoading(false);
    }
  }

  const email = session?.user?.email;
  const role = session?.user?.role;
  const continueHref =
    role === "CASTING" ? "/auth/casting-onboarding" : "/auth/actor-onboarding";

  return (
    <div className="animate-fade-in">
      <div className="rounded-[24px] border border-accent/25 bg-bg-secondary/90 backdrop-blur-sm shadow-[var(--shadow-card)] p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c8a86b] via-[#e8d5a8] to-[#b58d4b]" />

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            {status === "verified" ? "Email verified" : "Verify your email"}
          </h1>
          {status === "verifying" && (
            <p className="text-sm text-text-secondary mt-2">Verifying your email...</p>
          )}
          {status === "idle" && (
            <p className="text-sm text-text-secondary mt-2">
              We sent a verification link to{" "}
              <span className="font-medium text-text-primary">{email ?? "your email"}</span>.
              Verify your address to continue.
            </p>
          )}
          {status === "verified" && (
            <p className="text-sm text-text-secondary mt-2">{message}</p>
          )}
          {status === "error" && (
            <p className="text-sm text-text-secondary mt-2">{message}</p>
          )}
        </div>

        {status === "verified" && (
          <div className="rounded-xl bg-success/10 border border-success/20 px-4 py-3 text-sm text-success mb-4">
            You can now continue setting up your account.
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger mb-4">
            {message}
          </div>
        )}

        {resendError && (
          <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger mb-4">
            {resendError}
          </div>
        )}

        {resendMessage && (
          <div className="rounded-xl bg-success/10 border border-success/20 px-4 py-3 text-sm text-success mb-4">
            {resendMessage}
          </div>
        )}

        {status === "verified" ? (
          session ? (
            <Link
              href={continueHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl h-13 px-7 text-base font-semibold transition-all duration-200 bg-gradient-to-r from-[#c8a86b] via-[#d4b87a] to-[#b58d4b] text-text-primary shadow-md hover:shadow-lg hover:brightness-105 border border-accent/30"
            >
              Continue
            </Link>
          ) : (
            <Link
              href="/auth/signin?verified=1"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl h-13 px-7 text-base font-semibold transition-all duration-200 bg-gradient-to-r from-[#c8a86b] via-[#d4b87a] to-[#b58d4b] text-text-primary shadow-md hover:shadow-lg hover:brightness-105 border border-accent/30"
            >
              Sign in to continue
            </Link>
          )
        ) : status !== "verifying" ? (
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full bg-gradient-to-r from-[#c8a86b] via-[#d4b87a] to-[#b58d4b] text-text-primary font-semibold shadow-md hover:shadow-lg hover:brightness-105 border border-accent/30"
              size="lg"
              disabled={resendLoading}
              onClick={handleResend}
            >
              {resendLoading ? "Sending..." : "Resend verification email"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            >
              Sign out
            </Button>
          </div>
        ) : null}

        {!session && status !== "verifying" && (
          <p className="mt-6 text-center text-sm text-text-secondary">
            <Link
              href="/auth/signin"
              className="font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export function VerifyEmailContent() {
  return (
    <Suspense>
      <VerifyEmailContentInner />
    </Suspense>
  );
}
