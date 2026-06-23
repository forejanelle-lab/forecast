import { NextResponse } from "next/server";

/** Fast liveness check — no database (for previews and dev tooling). */
export async function GET() {
  return NextResponse.json({ ok: true, service: "forecast" });
}
