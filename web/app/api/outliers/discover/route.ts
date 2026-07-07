import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runDiscovery } from "@/lib/discovery/runDiscovery";
import { remainingUnitsToday } from "@/lib/discovery/quota";

export const maxDuration = 60;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }

  const remaining = await remainingUnitsToday();
  if (remaining < 100) {
    return NextResponse.json(
      { error: "QUOTA_EXHAUSTED", remainingUnitsToday: remaining },
      { status: 429 }
    );
  }

  const result = await runDiscovery("MANUAL", session.user.id);
  return NextResponse.json(result);
}
