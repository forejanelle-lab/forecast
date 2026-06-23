"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordFormInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("This reset link is invalid. Request a new one.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(data.message ?? "Password updated successfully.");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="animate-fade-in">
        <div className="rounded-[24px] border border-accent/25 bg-bg-secondary/90 backdrop-blur-sm shadow-[var(--shadow-card)] p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
            Invalid reset link
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            This password reset link is invalid or missing. Request a new one.
          </p>
          <Link
            href="/auth/forgot-password"
            className="font-semibold text-accent hover:text-accent-hover transition-colors text-sm"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="rounded-[24px] border border-accent/25 bg-bg-secondary/90 backdrop-blur-sm shadow-[var(--shadow-card)] p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c8a86b] via-[#e8d5a8] to-[#b58d4b]" />

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Set a new password
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Choose a new password for your Fore Cast account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-success/10 border border-success/20 px-4 py-3 text-sm text-success">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1.5">
              New password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="border-accent/20 focus:ring-accent/40 bg-bg-primary/80"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Confirm password
            </label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="border-accent/20 focus:ring-accent/40 bg-bg-primary/80"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#c8a86b] via-[#d4b87a] to-[#b58d4b] text-text-primary font-semibold shadow-md hover:shadow-lg hover:brightness-105 border border-accent/30"
            size="lg"
            disabled={loading || Boolean(success)}
          >
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>

        {success && (
          <p className="mt-6 text-center text-sm text-text-secondary">
            <Link
              href="/auth/signin"
              className="font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              Sign in with your new password
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
