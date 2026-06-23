"use client";

import { ActorSignInHero } from "@/components/auth/actor-sign-in-hero";
import { CastingAuthHero } from "@/components/auth/casting-auth-hero";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { parseSignupRole } from "@/components/auth/sign-up-form";

function DefaultAuthHero() {
  return (
    <div className="gradient-hero relative flex w-full items-center justify-center p-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,168,107,0.15),transparent_50%)]" />
      <div className="relative max-w-md">
        <div className="mb-8">
          <Logo imageClassName="h-14" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
          The future of casting starts here.
        </h2>
        <p className="text-white/60 leading-relaxed">
          Join hundreds of actors and casting directors building careers and
          projects on the most elegant casting platform ever built.
        </p>
      </div>
    </div>
  );
}

export function AuthLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AuthLayoutShellContent>{children}</AuthLayoutShellContent>
    </Suspense>
  );
}

function AuthLayoutShellContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const signInRole =
    pathname === "/auth/signin"
      ? parseSignupRole(searchParams.get("role"))
      : null;
  const isCastingSignIn = signInRole === "CASTING";
  const isActorSignIn = signInRole === "ACTOR";
  const isActorSignup =
    pathname === "/auth/signup/actor";
  const isCastingSignup = pathname === "/auth/signup/casting";
  const isActorOnboarding = pathname === "/auth/actor-onboarding";
  const isCastingOnboarding = pathname === "/auth/casting-onboarding";
  const isActorThemed = isActorSignIn || isActorSignup || isActorOnboarding;
  const isCastingThemed =
    isCastingSignup || isCastingOnboarding || isCastingSignIn;

  return (
    <div className="min-h-screen flex bg-bg-primary">
      <div className="hidden lg:flex lg:w-1/2 shrink-0">
        {isActorThemed ? (
          <ActorSignInHero />
        ) : isCastingThemed ? (
          <CastingAuthHero />
        ) : (
          <DefaultAuthHero />
        )}
      </div>

      <div
        className={cn(
          "flex-1 flex items-center justify-center p-6 sm:p-12 relative",
          isActorThemed &&
            "bg-[linear-gradient(180deg,#fffefb_0%,#faf8f4_45%,#f5f0ff_100%)]",
          isCastingThemed &&
            "bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_50%,#eef2ff_100%)]",
        )}
      >
        {isActorThemed && (
          <>
            <div className="pointer-events-none absolute top-10 right-10 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-16 left-8 h-40 w-40 rounded-full bg-fuchsia-400/10 blur-3xl" />
            <div className="pointer-events-none absolute top-1/3 left-1/4 h-32 w-32 rounded-full bg-violet-400/10 blur-3xl" />
          </>
        )}
        <div
          className={cn(
            "w-full relative z-10",
            isActorOnboarding ? "max-w-xl" : "max-w-md",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
