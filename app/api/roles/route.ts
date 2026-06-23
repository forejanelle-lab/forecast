import { apiSuccess } from "@/lib/auth-helpers";
import { requireAuthSession } from "@/lib/api/guards";
import { getOpenRolesForActors } from "@/lib/data/projects";
import { NextResponse } from "next/server";

export async function GET() {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const roles = await getOpenRolesForActors();
  return apiSuccess({ roles });
}
