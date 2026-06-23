import { apiSuccess } from "@/lib/auth-helpers";
import { requireAuthSession } from "@/lib/api/guards";
import { searchActors } from "@/lib/data/actors";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const sessionOrError = await requireAuthSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;

  const actors = await searchActors(q);
  return apiSuccess({ actors });
}
