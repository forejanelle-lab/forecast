import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export async function activateActorSubscriptionOnOnboarding(
  userId: string,
): Promise<void> {
  const profile = await prisma.actorProfile.findUnique({
    where: { userId },
    select: {
      membership: true,
      trialEndsAt: true,
      trialStartedAt: true,
    },
  });

  const now = new Date();
  const hasPremiumTrial =
    profile?.membership === "PREMIUM" && profile.trialEndsAt != null;

  const plan: SubscriptionPlan = hasPremiumTrial ? "ACTOR_PREMIUM" : "FREE";
  const status: SubscriptionStatus = hasPremiumTrial ? "TRIALING" : "ACTIVE";

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { subscribed: true, subscribedAt: now },
    }),
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status,
        trialEndsAt: profile?.trialEndsAt ?? null,
        currentPeriodStart: profile?.trialStartedAt ?? now,
        currentPeriodEnd: profile?.trialEndsAt ?? null,
      },
      update: {
        plan,
        status,
        trialEndsAt: profile?.trialEndsAt ?? null,
        currentPeriodStart: profile?.trialStartedAt ?? now,
        currentPeriodEnd: profile?.trialEndsAt ?? null,
      },
    }),
  ]);
}
