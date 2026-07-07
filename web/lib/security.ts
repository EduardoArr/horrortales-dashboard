import { timingSafeEqual } from "node:crypto";

/** Constant-time string comparison for secrets/tokens (bearer tokens,
 *  webhook signatures, etc). A plain `===` leaks a few nanoseconds of
 *  information per matching byte, which is a real (if narrow) attack
 *  surface for long-lived static secrets like CRON_SECRET. */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    // Compare bufA against itself so this branch takes roughly the same
    // time as the equal-length path instead of returning immediately.
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
