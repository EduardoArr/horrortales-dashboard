import { describe, expect, it } from "vitest";
import { buildIntroStageTool, buildMessages, buildToolChoice } from "./introStage";
import type { IntroStageInput } from "./types";

function baseInput(overrides: Partial<IntroStageInput> = {}): IntroStageInput {
  return {
    chosenTitle: "La llamada que nadie contestó a tiempo",
    thumbnailDescription: "Primer plano de un teléfono fijo descolgado",
    research: "Investigación completa del caso X.",
    referenceScript: null,
    clarifications: [],
    ...overrides,
  };
}

describe("buildIntroStageTool", () => {
  it("is a strict tool", () => {
    const tool = buildIntroStageTool();
    expect(tool.strict).toBe(true);
    expect(tool.input_schema.additionalProperties).toBe(false);
  });

  it("does not set minItems/maxItems on variations (Anthropic strict tools only allow 0 or 1)", () => {
    const tool = buildIntroStageTool();
    const variationsSchema = (
      tool.input_schema.properties as Record<string, { minItems?: number; maxItems?: number }>
    ).variations;
    expect(variationsSchema.minItems).toBeUndefined();
    expect(variationsSchema.maxItems).toBeUndefined();
  });
});

describe("buildToolChoice", () => {
  it("forces the generate_intro_variations tool", () => {
    expect(buildToolChoice()).toEqual({ type: "tool", name: "generate_intro_variations" });
  });
});

describe("buildMessages", () => {
  it("includes the chosen title and thumbnail description", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("La llamada que nadie contestó a tiempo");
    expect(text).toContain("Primer plano de un teléfono fijo descolgado");
  });

  it("notes the absence of a reference script when none is given", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("No se proporcionó guion de referencia");
  });

  it("appends the clarifications block when clarifications exist", () => {
    const messages = buildMessages(
      baseInput({
        clarifications: [{ phase: "INTRO", question: "¿Hora?", answer: "3:14am" }],
      })
    );
    const text = messages[0].content as string;
    expect(text).toContain("ACLARACIONES YA CONFIRMADAS POR EL USUARIO");
  });
});
