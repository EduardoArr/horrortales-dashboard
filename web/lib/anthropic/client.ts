import Anthropic from "@anthropic-ai/sdk";

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return key;
}

let client: Anthropic | undefined;
export function getAnthropicClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: apiKey() });
  return client;
}
