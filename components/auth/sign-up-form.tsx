"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACTOR_AUTH_CLOSED_MESSAGE,
  isActorAccountDisabled,
} from "@/lib/auth-access";
import { buildSignupReferralSourceFromSearchParams } from "@/lib/signup-referral-source";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Film, Users } from "lucide-react";

export type SignupRole = "ACTOR" | "CASTING";

export function parseSignupRole(value: string | null): SignupRole | null {
  if (value === "ACTOR" || value === "CASTING") return value;
  if (value?.toLowerCase() === "actor") return "ACTOR";
  if (value?.toLowerCase() === "casting") return "CASTING";
  return null;
}

interface SignUpFormProps {
  defaultRole?: SignupRole;
  allowRoleChange?: boolean;
}

function SignUpFormContent({
  defaultRole = "ACTOR",
  allowRoleChange = true,
}: SignUpFormProps) {
  const searchParams = useSearchParams();
  const queryRole = parseSignupRole(searchParams.get("role"));

  const [manualRole, setManualRole] = useState<SignupRole | null>(null);
  const role = allowRoleChange
    ? (queryRole ?? manualRole ?? defaultRole)
    : defaultRole;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isCasting = role === "CASTING";
  const actorSignupDisabled = !isCasting && isActorAccountDisabled();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (actorSignupDisabled) return;
    setError("");
    setSuccess("");
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const submitRole = allowRoleChange ? role : defaultRole;

    if (!normalizedFirstName || !normalizedLastName) {
      setError("First and last name are required.");
      setLoading(false);
      return;
    }

    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          email: normalizedEmail,
          password,
          role: submitRole,
          referralSource: buildSignupReferralSourceFromSearchParams(
            searchParams,
            document.referrer,
          ),
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      setSuccess(
        registerData.message ??
          "Account created. Check your email to verify your address.",
      );

      const signInResult = await signIn("credentials", {
        email: normalizedEmail,
        password,
        rememberMe: "true",
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created but sign in failed. Please sign in manually.");
        setLoading(false);
        return;
      }

      window.location.assign(
        submitRole === "CASTING"
          ? "/auth/casting-onboarding"
          : "/auth/actor-onboarding",
      );
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
          {isCasting ? "Create your casting account" : "Create your actor account"}
        </h1>
        <p className="text-text-secondary">
          {isCasting
            ? "Set up your casting workspace on Fore Cast"
            : "Join Fore Cast and start your acting journey"}
        </p>
      </div>

      {allowRoleChange ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setManualRole("ACTOR")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200",
              role === "ACTOR"
                ? "border-accent bg-accent/5 shadow-sm"
                : "border-border bg-bg-secondary hover:border-border/80",
            )}
          >
            <Film
              className={cn(
                "h-5 w-5",
                role === "ACTOR" ? "text-accent" : "text-text-secondary",
              )}
            />
            <span className="text-sm font-medium text-text-primary">Actor</span>
          </button>
          <button
            type="button"
            onClick={() => setManualRole("CASTING")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200",
              role === "CASTING"
                ? "border-accent bg-accent/5 shadow-sm"
                : "border-border bg-bg-secondary hover:border-border/80",
            )}
          >
            <Users
              className={cn(
                "h-5 w-5",
                role === "CASTING" ? "text-accent" : "text-text-secondary",
              )}
            />
            <span className="text-sm font-medium text-text-primary">
              Casting Director
            </span>
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-text-primary">
          {isCasting ? "Casting director account" : "Actor account"}
        </div>
      )}

      {actorSignupDisabled && (
        <div className="rounded-xl bg-warning/10 border border-warning/30 px-4 py-3 text-sm text-text-primary mb-4">
          {ACTOR_AUTH_CLOSED_MESSAGE}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              First name
            </label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Last name
            </label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>
        </div>

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
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1.5">
            Password
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
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loading || actorSignupDisabled}
        >
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href={
            isCasting ? "/auth/signin?role=CASTING" : "/auth/signin?role=ACTOR"
          }
          className="font-medium text-accent hover:text-accent-hover transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm(props: SignUpFormProps) {
  return (
    <Suspense fallback={null}>
      <SignUpFormContent {...props} />
    </Suspense>
  );
}
