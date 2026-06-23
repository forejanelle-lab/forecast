"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function ActorOnboardingGuard({
  userId,
  onboardingComplete = false,
  children,
}: {
  userId?: string;
  onboardingComplete?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!userId) return;
    if (pathname.startsWith("/auth/actor-onboarding")) return;
    if (onboardingComplete) return;
    router.replace("/auth/actor-onboarding");
  }, [userId, onboardingComplete, pathname, router]);

  return children;
}
