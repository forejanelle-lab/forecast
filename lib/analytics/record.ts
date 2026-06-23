import type { AppUserRole } from "@/auth.config";
import { isActorProfileComplete } from "@/lib/actor-profile-completeness";
import { sanitizeAnalyticsMetadata } from "@/lib/analytics/sanitize";
import { prisma } from "@/lib/prisma";
import type { BusinessAnalyticsEventType, UserRole } from "@prisma/client";

export interface RecordBusinessEventInput {
  eventType: BusinessAnalyticsEventType;
  userId?: string | null;
  userRole?: UserRole | AppUserRole | null;
  metadata?: Record<string, unknown>;
}

export async function recordBusinessEvent(
  input: RecordBusinessEventInput,
): Promise<void> {
  try {
    const metadata = sanitizeAnalyticsMetadata(input.metadata);

    await prisma.businessAnalyticsEvent.create({
      data: {
        eventType: input.eventType,
        userId: input.userId ?? null,
        userRole: (input.userRole as UserRole | undefined) ?? null,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error("[analytics] failed to record event:", input.eventType, error);
  }
}

export async function recordSignupEvents(
  userId: string,
  role: UserRole | AppUserRole,
): Promise<void> {
  await recordBusinessEvent({
    eventType: "SIGNUP",
    userId,
    userRole: role,
  });

  await recordBusinessEvent({
    eventType: role === "ACTOR" ? "ACTOR_REGISTRATION" : "CASTING_REGISTRATION",
    userId,
    userRole: role,
  });
}

export async function recordProfileCompletionOnce(
  userId: string,
  userRole: UserRole | AppUserRole,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const existing = await prisma.businessAnalyticsEvent.findFirst({
    where: { eventType: "PROFILE_COMPLETION", userId },
    select: { id: true },
  });

  if (existing) return;

  await recordBusinessEvent({
    eventType: "PROFILE_COMPLETION",
    userId,
    userRole,
    metadata,
  });
}

export async function recordActorProfileCompletionIfComplete(
  userId: string,
): Promise<void> {
  const profile = await prisma.actorProfile.findUnique({
    where: { userId },
    include: {
      credits: { select: { id: true } },
      headshots: { select: { id: true } },
      media: { select: { id: true } },
    },
  });

  if (!profile) return;

  const complete = isActorProfileComplete({
    bio: profile.bio,
    location: profile.location,
    playingAgeMin: profile.playingAgeMin,
    playingAgeMax: profile.playingAgeMax,
    height: profile.height,
    unionStatus: profile.unionStatus,
    skills: profile.skills,
    languages: profile.languages,
    credits: profile.credits,
    headshots: profile.headshots,
    media: profile.media,
    hasProfilePhoto: Boolean(profile.profilePhotoUrl?.trim()),
  });

  if (!complete) return;

  await recordProfileCompletionOnce(userId, "ACTOR", { source: "actor_profile" });
}

export async function recordPremiumUpgrade(
  userId: string,
  userRole: UserRole | AppUserRole,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await recordBusinessEvent({
    eventType: "PREMIUM_UPGRADE",
    userId,
    userRole,
    metadata,
  });
}
