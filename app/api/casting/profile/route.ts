import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import { getCastingProfile, updateCastingProfile } from "@/lib/data/actors";
import { NextResponse } from "next/server";

const patchSchema = z.object({
  officeName: z.string().optional(),
  company: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  profilePhotoUrl: z.string().nullable().optional(),
});

export async function GET() {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const profile = await getCastingProfile(sessionOrError.user.id);
  if (!profile) return apiError("Profile not found", 404);

  return apiSuccess({ profile });
}

export async function PATCH(request: Request) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const profile = await updateCastingProfile(sessionOrError.user.id, parsed.data);

  return apiSuccess({ profile });
}
