import { describe, expect, it } from "vitest";
import { buildMessages, buildTransitionsStageTool, buildToolChoice } from "./transitionsStage";
import type { TransitionsStageInput } from "./types";

function baseInput(overrides: Partial<TransitionsStageInput> = {}): TransitionsStageInput {
  return {
    chosenTitle: "La llamada que nadie contestó a tiempo",
    sections: [
      { order: 1, workingTitle: "La llamada de las 3:14", text: "Texto de la sección 1." },
      { order: 2, workingTitle: "Cuarenta minutos de silencio", text: "Texto de la sección 2." },
    ],
    clarifications: [],
    ...overrides,
  };
}

describe("buildTransitionsStageTool", () => {
  it("is a strict tool", () => {
    const tool = buildTransitionsStageTool();
    expect(tool.strict).toBe(true);
    expect(tool.input_schema.additionalProperties).toBe(false);
  });

  it("does not set minItems/maxItems on hooks/options (Anthropic strict tools only allow 0 or 1)", () => {
    const tool = buildTransitionsStageTool();
    const properties = tool.input_schema.properties as Record<
      string,
      { minItems?: number; maxItems?: number; items?: { properties?: Record<string, unknown> } }
    >;
    expect(properties.hooks.minItems).toBeUndefined();
    expect(properties.hooks.maxItems).toBeUndefined();
    const optionsSchema = properties.hooks.items?.properties?.options as
      | { minItems?: number; maxItems?: number }
      | undefined;
    expect(optionsSchema?.minItems).toBeUndefined();
    expect(optionsSchema?.maxItems).toBeUndefined();
  });
});

describe("buildToolChoice", () => {
  it("forces the generate_transition_hooks tool", () => {
    expect(buildToolChoice()).toEqual({ type: "tool", name: "generate_transition_hooks" });
  });
});

describe("buildMessages", () => {
  it("includes all sections in order with their full text", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("Sección 1: La llamada de las 3:14");
    expect(text).toContain("Texto de la sección 1.");
    expect(text).toContain("Sección 2: Cuarenta minutos de silencio");
    expect(text).toContain("Texto de la sección 2.");
  });

  it("includes the chosen title", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("La llamada que nadie contestó a tiempo");
  });

  it("spells out the exact expected hook count and afterSectionOrder values instead of relying on the model to compute N-1", () => {
    const messages = buildMessages(
      baseInput({
        sections: [
          { order: 1, workingTitle: "Uno", text: "..." },
          { order: 2, workingTitle: "Dos", text: "..." },
          { order: 3, workingTitle: "Tres", text: "..." },
          { order: 4, workingTitle: "Cuatro", text: "..." },
        ],
      })
    );
    const text = messages[0].content as string;
    expect(text).toContain("EXACTAMENTE 3 sets de hooks");
    expect(text).toContain("1, 2, 3");
  });
});
