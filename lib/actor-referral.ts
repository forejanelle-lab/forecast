import { prisma } from "@/lib/prisma";

export const ACTOR_TRIAL_DAYS = 30;

export function isValidReferralEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getTrialEndDate(start = new Date()): Date {
  const trialEndsAt = new Date(start);
  trialEndsAt.setDate(trialEndsAt.getDate() + ACTOR_TRIAL_DAYS);
  return trialEndsAt;
}

export async function submitActorReferral(
  referrerId: string,
  referrerEmail: string,
  referredName: string,
  referredEmail: string,
) {
  const trimmedName = referredName.trim();
  const normalizedReferredEmail = referredEmail.trim().toLowerCase();
  const normalizedReferrerEmail = referrerEmail.trim().toLowerCase();

  if (!trimmedName) {
    throw new ReferralValidationError("Please enter your fellow actor's name.");
  }

  if (!isValidReferralEmail(normalizedReferredEmail)) {
    throw new ReferralValidationError("Please enter a valid email address.");
  }

  if (normalizedReferredEmail === normalizedReferrerEmail) {
    throw new ReferralValidationError(
      "Please refer another actor — you can't use your own email.",
    );
  }

  const profile = await prisma.actorProfile.findUnique({
    where: { userId: referrerId },
    select: { id: true },
  });

  if (!profile) {
    throw new ReferralValidationError("Actor profile not found.");
  }

  const trialStartedAt = new Date();
  const trialEndsAt = getTrialEndDate(trialStartedAt);

  const referral = await prisma.actorReferral.upsert({
    where: { referrerId },
    create: {
      referrerId,
      referredName: trimmedName,
      referredEmail: normalizedReferredEmail,
      trialStartedAt,
      trialEndsAt,
    },
    update: {
      referredName: trimmedName,
      referredEmail: normalizedReferredEmail,
      trialStartedAt,
      trialEndsAt,
    },
  });

  await prisma.actorProfile.update({
    where: { userId: referrerId },
    data: {
      membership: "PREMIUM",
      trialStartedAt,
      trialEndsAt,
    },
  });

  return {
    referralId: referral.id,
    referredName: referral.referredName,
    referredEmail: referral.referredEmail,
    trialStartedAt: referral.trialStartedAt.toISOString(),
    trialEndsAt: referral.trialEndsAt.toISOString(),
    membership: "PREMIUM" as const,
  };
}

export class ReferralValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferralValidationError";
  }
}
