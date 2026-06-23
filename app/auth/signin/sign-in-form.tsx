"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { parseSignupRole } from "@/components/auth/sign-up-form";
import {
  ACTOR_AUTH_CLOSED_MESSAGE,
  isActorAccountDisabled,
} from "@/lib/auth-access";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type DbHealth = {
  ok: boolean;
  reason?: string;
  message?: string;
};

export default function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const verified = searchParams.get("verified");
  const preferredRole = parseSignupRole(searchParams.get("role"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    verified === "1" ? "Email verified. Sign in to continue." : "",
  );
  const [setupWarning, setSetupWarning] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDbHealth(): Promise<DbHealth> {
    const res = await fetch("/api/health/db");
    return res.json();
  }

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8_000);

    fetch("/api/health/db", { signal: controller.signal })
      .then((res) => res.json())
      .then((health: DbHealth) => {
        if (!health.ok) {
          setSetupWarning(
            health.message ??
              "Database is not configured. Update .env with Supabase credentials and run npm run db:setup.",
          );
        }
      })
      .catch(() => {
        // Don't block sign-in if the health check is slow or unavailable.
      })
      .finally(() => window.clearTimeout(timeoutId));
  }, []);

  async function resolveLoginError(): Promise<string> {
    const health = await loadDbHealth();

    if (!health.ok) {
      return health.message ?? "Database not connected. Check .env and run npm run db:setup.";
    }

    return "Invalid email or password.";
  }

  const isActorThemed = preferredRole === "ACTOR";
  const isCastingThemed = preferredRole === "CASTING";
  const isNeutral = !isActorThemed && !isCastingThemed;
  const actorSignInDisabled = isActorThemed && isActorAccountDisabled();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (actorSignInDisabled) return;
    setError("");
    setSuccess("");
    setLoading(true);

    const loginEmail = email.trim().toLowerCase();

    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password,
        rememberMe: rememberMe ? "true" : "false",
        redirect: false,
      });

      if (result?.error) {
        setError(await resolveLoginError());
        setLoading(false);
        return;
      }

      let destination =
        callbackUrl && !callbackUrl.startsWith("/auth") ? callbackUrl : null;

      if (!destination) {
        if (preferredRole === "CASTING") {
          destination = "/casting";
        } else if (preferredRole === "ACTOR") {
          destination = "/actor";
        } else {
          const sessionRes = await fetch("/api/auth/session");
          const session = (await sessionRes.json()) as {
            user?: { role?: string };
          };
          destination =
            session?.user?.role === "CASTING" ? "/casting" : "/actor";
        }
      }

      window.location.assign(destination);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div
        className={
          isNeutral
            ? "rounded-[24px] border border-border/60 bg-bg-secondary shadow-[var(--shadow-card)] p-6 sm:p-8"
            : "rounded-[24px] border border-accent/25 bg-bg-secondary/90 backdrop-blur-sm shadow-[var(--shadow-card)] p-6 sm:p-8 relative overflow-hidden"
        }
      >
        {!isNeutral && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c8a86b] via-[#e8d5a8] to-[#b58d4b]" />
        )}

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            {isActorThemed ? "Welcome back, actor" : isCastingThemed ? "Casting sign in" : "Welcome back"}
          </h1>
          {isNeutral && (
            <p className="text-sm text-text-secondary mt-1">
              Sign in to your Fore Cast account.
            </p>
          )}
        </div>

        {actorSignInDisabled && (
          <div className="rounded-xl bg-warning/10 border border-warning/30 px-4 py-3 text-sm text-text-primary mb-4">
            {ACTOR_AUTH_CLOSED_MESSAGE}
          </div>
        )}

        {setupWarning && (
          <div className="rounded-xl bg-warning/10 border border-warning/30 px-4 py-3 text-sm text-text-primary mb-4">
            {setupWarning}
          </div>
        )}

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
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={
                isNeutral
                  ? undefined
                  : "border-accent/20 focus:ring-accent/40 bg-bg-primary/80"
              }
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-sm font-medium text-text-primary">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={
                isNeutral
                  ? undefined
                  : "border-accent/20 focus:ring-accent/40 bg-bg-primary/80"
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent/40"
            />
            Keep me signed in for 30 days
          </label>

          <Button
            type="submit"
            className={
              isNeutral
                ? "w-full"
                : "w-full bg-gradient-to-r from-[#c8a86b] via-[#d4b87a] to-[#b58d4b] text-text-primary font-semibold shadow-md hover:shadow-lg hover:brightness-105 border border-accent/30"
            }
            size="lg"
            disabled={loading || actorSignInDisabled}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href={
              preferredRole === "CASTING"
                ? "/auth/signup/casting"
                : preferredRole === "ACTOR"
                  ? "/auth/signup/actor"
                  : "/auth/signup"
            }
            className="font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
