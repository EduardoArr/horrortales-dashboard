import { NextResponse } from "next/server";
import { runDiscovery } from "@/lib/discovery/runDiscovery";
import { timingSafeStringEqual } from "@/lib/security";

export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  // Fail closed if CRON_SECRET isn't configured — an empty/unset secret
  // must never be treated as "no auth required".
  if (!cronSecret || !authHeader) {
    return new NextResponse(null, { status: 401 });
  }
  if (!timingSafeStringEqual(authHeader, `Bearer ${cronSecret}`)) {
    return new NextResponse(null, { status: 401 });
  }

  const result = await runDiscovery("CRON");
  return NextResponse.json(result);
}
