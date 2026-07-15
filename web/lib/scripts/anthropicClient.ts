import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAnthropicClient } from "@/lib/anthropic/client";
import { isAnthropicMock } from "@/lib/anthropic/config";
import { ANTHROPIC_MAX_TOKENS, ANTHROPIC_MODEL } from "./config";
import {
  buildMessages as buildTitleMessages,
  buildSystemPrompt as buildTitleSystemPrompt,
  buildTitleStageTool,
  buildToolChoice as buildTitleToolChoice,
} from "./titleStage";
import {
  buildMessages as buildIntroMessages,
  buildSystemPrompt as buildIntroSystemPrompt,
  buildIntroStageTool,
  buildToolChoice as buildIntroToolChoice,
} from "./introStage";
import {
  buildMessages as buildOutlineMessages,
  buildSystemPrompt as buildOutlineSystemPrompt,
  buildOutlineStageTool,
  buildToolChoice as buildOutlineToolChoice,
} from "./outlineStage";
import {
  buildMessages as buildPayoffsMessages,
  buildSystemPrompt as buildPayoffsSystemPrompt,
  buildPayoffsStageTool,
  buildToolChoice as buildPayoffsToolChoice,
} from "./payoffsStage";
import {
  buildMessages as buildSectionMessages,
  buildSystemPrompt as buildSectionSystemPrompt,
  buildSectionStageTool,
  buildToolChoice as buildSectionToolChoice,
} from "./sectionStage";
import {
  buildMessages as buildTransitionsMessages,
  buildSystemPrompt as buildTransitionsSystemPrompt,
  buildTransitionsStageTool,
  buildToolChoice as buildTransitionsToolChoice,
} from "./transitionsStage";
import {
  buildMessages as buildCtasMessages,
  buildSystemPrompt as buildCtasSystemPrompt,
  buildCtasStageTool,
  buildToolChoice as buildCtasToolChoice,
} from "./ctasStage";
import {
  buildMessages as buildStyleReviewMessages,
  buildSystemPrompt as buildStyleReviewSystemPrompt,
  buildStyleReviewStageTool,
  buildToolChoice as buildStyleReviewToolChoice,
} from "./styleReviewStage";
import {
  parseCtasStageOutput,
  parseIntroStageOutput,
  parseOutlineStageOutput,
  parsePayoffsStageOutput,
  parseSectionStageOutput,
  parseStyleReviewStageOutput,
  parseTitleStageOutput,
  parseTransitionsStageOutput,
} from "./responseParser";
import type {
  CtasStageInput,
  CtasStageOutput,
  IntroStageInput,
  IntroStageOutput,
  OutlineStageInput,
  OutlineStageOutput,
  PayoffsStageInput,
  PayoffsStageOutput,
  SectionStageInput,
  SectionStageOutput,
  StyleReviewStageInput,
  StyleReviewStageOutput,
  TitleStageInput,
  TitleStageOutput,
  TransitionsStageInput,
  TransitionsStageOutput,
} from "./types";
import type Anthropic from "@anthropic-ai/sdk";

const FIXTURES_DIR = join(process.cwd(), "lib/scripts/__fixtures__");

function loadFixture(name: string): unknown {
  const raw = readFileSync(join(FIXTURES_DIR, name), "utf-8");
  return JSON.parse(raw);
}

/** Manual testing hook: set SCRIPT_MOCK_SCENARIO="needs_input" alongside
 *  ANTHROPIC_MOCK=true to exercise the clarification flow without a real
 *  API call. Any other value (or unset) uses the happy-path fixture. */
function mockScenario(): "ok" | "needs_input" {
  return process.env.SCRIPT_MOCK_SCENARIO === "needs_input" ? "needs_input" : "ok";
}

function extractToolUse(response: Anthropic.Message): unknown {
  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) throw new Error("Anthropic response did not include a tool_use block");
  return toolUse.input;
}

export async function generateTitleStage(input: TitleStageInput): Promise<TitleStageOutput> {
  if (isAnthropicMock()) {
    const fixture =
      mockScenario() === "needs_input"
        ? "titleStage.needsInput.json"
        : input.mode === "VALIDATE"
          ? "titleStage.validate.json"
          : "titleStage.generate.json";
    return parseTitleStageOutput(loadFixture(fixture));
  }

  const response = await getAnthropicClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: buildTitleSystemPrompt(),
    tools: [buildTitleStageTool()],
    tool_choice: buildTitleToolChoice(),
    messages: buildTitleMessages(input),
  });
  return parseTitleStageOutput(extractToolUse(response));
}

export async function generateIntroStage(input: IntroStageInput): Promise<IntroStageOutput> {
  if (isAnthropicMock()) {
    const fixture =
      mockScenario() === "needs_input" ? "introStage.needsInput.json" : "introStage.json";
    return parseIntroStageOutput(loadFixture(fixture));
  }

  const response = await getAnthropicClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: buildIntroSystemPrompt(),
    tools: [buildIntroStageTool()],
    tool_choice: buildIntroToolChoice(),
    messages: buildIntroMessages(input),
  });
  return parseIntroStageOutput(extractToolUse(response));
}

export async function generateOutlineStage(
  input: OutlineStageInput
): Promise<OutlineStageOutput> {
  if (isAnthropicMock()) {
    const fixture =
      mockScenario() === "needs_input" ? "outlineStage.needsInput.json" : "outlineStage.json";
    return parseOutlineStageOutput(loadFixture(fixture));
  }

  const response = await getAnthropicClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: buildOutlineSystemPrompt(),
    tools: [buildOutlineStageTool()],
    tool_choice: buildOutlineToolChoice(),
    messages: buildOutlineMessages(input),
  });
  return parseOutlineStageOutput(extractToolUse(response));
}

export async function generatePayoffsStage(
  input: PayoffsStageInput
): Promise<PayoffsStageOutput> {
  const expectedCount = input.outlineSections.length;
  if (isAnthropicMock()) {
    const fixture =
      mockScenario() === "needs_input" ? "payoffsStage.needsInput.json" : "payoffsStage.json";
    return parsePayoffsStageOutput(loadFixture(fixture), expectedCount);
  }

  const response = await getAnthropicClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: buildPayoffsSystemPrompt(),
    tools: [buildPayoffsStageTool()],
    tool_choice: buildPayoffsToolChoice(),
    messages: buildPayoffsMessages(input),
  });
  return parsePayoffsStageOutput(extractToolUse(response), expectedCount);
}

export async function generateSectionStage(
  input: SectionStageInput
): Promise<SectionStageOutput> {
  const expectedVariations = input.wantsTwoVariations ? 2 : 1;
  if (isAnthropicMock()) {
    const fixture =
      mockScenario() === "needs_input"
        ? "sectionStage.needsInput.json"
        : input.wantsTwoVariations
          ? "sectionStage.double.json"
          : "sectionStage.single.json";
    return parseSectionStageOutput(loadFixture(fixture), expectedVariations);
  }

  const response = await getAnthropicClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: buildSectionSystemPrompt(),
    tools: [buildSectionStageTool()],
    tool_choice: buildSectionToolChoice(),
    messages: buildSectionMessages(input),
  });
  return parseSectionStageOutput(extractToolUse(response), expectedVariations);
}

export async function generateTransitionsStage(
  input: TransitionsStageInput
): Promise<TransitionsStageOutput> {
  const expectedJunctions = input.sections.length - 1;
  if (isAnthropicMock()) {
    const fixture =
      mockScenario() === "needs_input"
        ? "transitionsStage.needsInput.json"
        : "transitionsStage.json";
    return parseTransitionsStageOutput(loadFixture(fixture), expectedJunctions);
  }

  // This stage writes 6 hook options per junction (N-1 of them), which is
  // measurably more output than the other stages: a real run with 10
  // sections used 3354 of the shared 4096-token default (82%) — with the
  // longer section text real scripts have, that's an easy truncation, which
  // shows up as a wrong `hooks.length` even though the model tried to
  // deliver the right count. Give this call its own larger budget instead of
  // sharing the global default.
  const TRANSITIONS_MAX_TOKENS = Math.max(ANTHROPIC_MAX_TOKENS, 12000);

  const response = await getAnthropicClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: TRANSITIONS_MAX_TOKENS,
    system: buildTransitionsSystemPrompt(),
    tools: [buildTransitionsStageTool()],
    tool_choice: buildTransitionsToolChoice(),
    messages: buildTransitionsMessages(input),
  });
  return parseTransitionsStageOutput(extractToolUse(response), expectedJunctions);
}

export async function generateCtasStage(input: CtasStageInput): Promise<CtasStageOutput> {
  if (isAnthropicMock()) {
    const fixture =
      mockScenario() === "needs_input" ? "ctasStage.needsInput.json" : "ctasStage.json";
    return parseCtasStageOutput(loadFixture(fixture));
  }

  const response = await getAnthropicClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: buildCtasSystemPrompt(),
    tools: [buildCtasStageTool()],
    tool_choice: buildCtasToolChoice(),
    messages: buildCtasMessages(input),
  });
  return parseCtasStageOutput(extractToolUse(response));
}

export async function generateStyleReviewStage(
  input: StyleReviewStageInput
): Promise<StyleReviewStageOutput> {
  if (isAnthropicMock()) {
    const fixture =
      mockScenario() === "needs_input"
        ? "styleReviewStage.needsInput.json"
        : "styleReviewStage.json";
    return parseStyleReviewStageOutput(loadFixture(fixture));
  }

  const response = await getAnthropicClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: buildStyleReviewSystemPrompt(),
    tools: [buildStyleReviewStageTool()],
    tool_choice: buildStyleReviewToolChoice(),
    messages: buildStyleReviewMessages(input),
  });
  return parseStyleReviewStageOutput(extractToolUse(response));
}
