import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ANTHROPIC_MAX_TOKENS, ANTHROPIC_MODEL } from "./config";
import { getAnthropicClient } from "@/lib/anthropic/client";
import { isAnthropicMock } from "@/lib/anthropic/config";
import {
  buildSystemPrompt,
  buildThumbnailIdeaMessages,
  buildThumbnailIdeaTool,
  buildToolChoice,
} from "./promptBuilder";
import { parseThumbnailIdeaOutput } from "./responseParser";
import type { BuildPromptInput, ThumbnailIdeaGenerationOutput } from "./types";
import type Anthropic from "@anthropic-ai/sdk";

const FIXTURES_DIR = join(process.cwd(), "lib/thumbnails/__fixtures__");

function loadFixture(): unknown {
  const raw = readFileSync(join(FIXTURES_DIR, "generateThumbnailIdea.json"), "utf-8");
  return JSON.parse(raw);
}

export async function generateThumbnailIdea(
  input: BuildPromptInput
): Promise<ThumbnailIdeaGenerationOutput> {
  if (isAnthropicMock()) {
    return parseThumbnailIdeaOutput(loadFixture());
  }

  const response = await getAnthropicClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: buildSystemPrompt(),
    tools: [buildThumbnailIdeaTool()],
    tool_choice: buildToolChoice(),
    messages: buildThumbnailIdeaMessages(input),
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Anthropic response did not include a tool_use block");
  }

  return parseThumbnailIdeaOutput(toolUse.input);
}
