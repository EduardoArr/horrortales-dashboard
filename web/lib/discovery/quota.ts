import { prisma } from "../prisma";
import { DAILY_QUOTA_CAP } from "./config";

function todayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

export async function getUnitsUsedToday(): Promise<number> {
  const row = await prisma.quotaUsage.findUnique({
    where: { date: todayUtc() },
  });
  return row?.unitsUsed ?? 0;
}

export async function recordUnitsUsed(units: number): Promise<number> {
  if (units <= 0) return getUnitsUsedToday();
  const date = todayUtc();
  const row = await prisma.quotaUsage.upsert({
    where: { date },
    create: { date, unitsUsed: units },
    update: { unitsUsed: { increment: units } },
  });
  return row.unitsUsed;
}

/** Whether spending `units` more today would exceed the daily cap. */
export async function wouldExceedCap(units: number): Promise<boolean> {
  const used = await getUnitsUsedToday();
  return used + units > DAILY_QUOTA_CAP;
}

export async function remainingUnitsToday(): Promise<number> {
  const used = await getUnitsUsedToday();
  return Math.max(DAILY_QUOTA_CAP - used, 0);
}
