import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import { persistCastingOnboardingProfile } from "@/lib/data/actors";
import { NextResponse } from "next/server";

const schema = z.object({
  officeName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  profilePhotoUrl: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await persistCastingOnboardingProfile(sessionOrError.user.id, parsed.data);

  return apiSuccess({ message: "Profile saved." });
}
