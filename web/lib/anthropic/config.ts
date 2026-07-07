function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Vision-capable, supports strict tool use. Override for quality/cost tuning
 *  without touching code. */
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

export const ANTHROPIC_MAX_TOKENS = envInt("ANTHROPIC_MAX_TOKENS", 4096);

export function isAnthropicMock(): boolean {
  return process.env.ANTHROPIC_MOCK === "true";
}
