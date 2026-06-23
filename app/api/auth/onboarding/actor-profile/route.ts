import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireActorSession } from "@/lib/api/guards";
import { persistActorOnboardingProfile } from "@/lib/data/actors";
import { NextResponse } from "next/server";

const schema = z.object({
  bio: z.string().optional(),
  locations: z.array(z.string()).optional(),
  playingAgeMin: z.string().optional(),
  playingAgeMax: z.string().optional(),
  height: z.string().optional(),
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
    .optional(),
  videos: z
    .array(
      z.object({
        label: z.string(),
        url: z.string().optional(),
        fileName: z.string().optional(),
      }),
    )
    .optional(),
});

export async function POST(request: Request) {
  const sessionOrError = await requireActorSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const data = parsed.data;
  const playingAgeMin = data.playingAgeMin ? Number(data.playingAgeMin) : null;
  const playingAgeMax = data.playingAgeMax ? Number(data.playingAgeMax) : null;

  await persistActorOnboardingProfile(sessionOrError.user.id, {
    bio: data.bio,
    locations: data.locations,
    playingAgeMin: Number.isFinite(playingAgeMin) ? playingAgeMin : null,
    playingAgeMax: Number.isFinite(playingAgeMax) ? playingAgeMax : null,
    height: data.height,
    skills: data.skills,
    languages: data.languages,
    profilePhotoUrl: data.profilePhotoUrl,
    headshots: data.headshots,
    videos: data.videos,
  });

  return apiSuccess({ message: "Profile saved." });
}
