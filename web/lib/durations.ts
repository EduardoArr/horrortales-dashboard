const DURATION_RE = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

/** Parses an ISO 8601 duration (e.g. "PT1H2M3S") into total seconds. */
export function parseDurationSeconds(duration: string): number {
  const match = DURATION_RE.exec(duration);
  if (!match) return 0;
  const [, hours, minutes, seconds] = match;
  return (
    Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0)
  );
}
