"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ActorOnboardingRedirect({
  onboardingComplete = false,
  children,
}: {
  userId: string;
  onboardingComplete?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (onboardingComplete) {
      router.replace("/actor");
    }
  }, [onboardingComplete, router]);

  return children;
}
