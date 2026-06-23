import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  recordProfileCompletionOnce,
} from "@/lib/analytics/record";
import { activateActorSubscriptionOnOnboarding } from "@/lib/subscriptions";
import type { AppUserRole } from "@/auth.config";

async function fetchOnboardingComplete(
  userId: string,
  role: AppUserRole,
): Promise<boolean> {
  if (role === "ACTOR") {
    const profile = await prisma.actorProfile.findUnique({
      where: { userId },
      select: { onboardingComplete: true },
    });
    return profile?.onboardingComplete ?? false;
  }

  const profile = await prisma.castingProfile.findUnique({
    where: { userId },
    select: { onboardingComplete: true },
  });
  return profile?.onboardingComplete ?? false;
}

/** Per-request cache — safe to call from layout + page in the same render. */
export const getOnboardingComplete = cache(fetchOnboardingComplete);

export async function markOnboardingComplete(
  userId: string,
  role: AppUserRole,
): Promise<void> {
  if (role === "ACTOR") {
    const profile = await prisma.actorProfile.update({
      where: { userId },
      data: { onboardingComplete: true },
    });
    await activateActorSubscriptionOnOnboarding(userId);
    await recordProfileCompletionOnce(userId, role, { source: "onboarding" });

    return;
  }

  await prisma.castingProfile.update({
    where: { userId },
    data: { onboardingComplete: true },
  });
  await recordProfileCompletionOnce(userId, role, { source: "onboarding" });
}
