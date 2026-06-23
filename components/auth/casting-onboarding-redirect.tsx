"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function CastingOnboardingRedirect({
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
      router.replace("/casting");
    }
  }, [onboardingComplete, router]);

  return children;
}
