import { ACTOR_MAX_HEADSHOTS, ACTOR_MAX_MEDIA } from "@/lib/actor-options";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireActorSession } from "@/lib/api/guards";
import {
  getActorProfileByUserId,
  persistActorOnboardingProfile,
  updateActorProfile,
} from "@/lib/data/actors";
import { getActorMembership } from "@/lib/data/projects";
import { recordActorProfileCompletionIfComplete } from "@/lib/analytics/record";
import { NextResponse } from "next/server";
import { z } from "zod";

const mediaItemSchema = z.object({
  label: z.string(),
  url: z.string().optional(),
  fileName: z.string().optional(),
  type: z.string().optional(),
});

const patchSchema = z.object({
  bio: z.string().optional(),
  location: z.string().optional(),
  locations: z.array(z.string()).optional(),
  height: z.string().optional(),
  gender: z.string().optional(),
  playingAgeMin: z.number().nullable().optional(),
  playingAgeMax: z.number().nullable().optional(),
  unionStatus: z.string().optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  profilePhotoUrl: z.string().nullable().optional(),
  headshots: z
    .array(
      z.object({
        label: z.string(),
        url: z.string().optional(),
        fileName: z.string().optional(),
        featured: z.boolean().optional(),
      }),
    )
    .max(ACTOR_MAX_HEADSHOTS)
    .optional(),
  videos: z.array(mediaItemSchema).max(ACTOR_MAX_MEDIA).optional(),
  materials: z.array(mediaItemSchema).max(ACTOR_MAX_MEDIA).optional(),
  credits: z
    .array(
      z.object({
        title: z.string(),
        role: z.string(),
        type: z.string(),
        year: z.number(),
      }),
    )
    .optional(),
  links: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
      }),
    )
    .optional(),
});

export async function GET() {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const profile = await getActorProfileByUserId(sessionOrError.user.id);
  if (!profile) return apiError("Profile not found", 404);

  const membership = await getActorMembership(sessionOrError.user.id);

  return apiSuccess({ profile, membership });
}

export async function PATCH(request: Request) {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const data = parsed.data;

  const videoCount = data.videos?.length ?? 0;
  const materialCount = data.materials?.length ?? 0;
  if (videoCount + materialCount > ACTOR_MAX_MEDIA) {
    return apiError(`Maximum ${ACTOR_MAX_MEDIA} media uploads allowed`);
  }

  const hasExtendedFields =
    data.headshots !== undefined ||
    data.videos !== undefined ||
    data.materials !== undefined ||
    data.credits !== undefined ||
    data.links !== undefined;

  if (hasExtendedFields) {
    await persistActorOnboardingProfile(sessionOrError.user.id, data);
  } else {
    await updateActorProfile(sessionOrError.user.id, data);
  }

  const profile = await getActorProfileByUserId(sessionOrError.user.id);

  void recordActorProfileCompletionIfComplete(sessionOrError.user.id);

  return apiSuccess({ profile });
}
