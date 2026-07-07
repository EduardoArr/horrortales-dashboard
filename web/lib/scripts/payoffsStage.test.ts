import { describe, expect, it } from "vitest";
import { buildMessages, buildPayoffsStageTool, buildToolChoice } from "./payoffsStage";
import type { PayoffsStageInput } from "./types";

function baseInput(overrides: Partial<PayoffsStageInput> = {}): PayoffsStageInput {
  return {
    chosenTitle: "La llamada que nadie contestó a tiempo",
    chosenIntro: "A las 3:14 de la madrugada, alguien marcó el 911 y colgó sin decir nada.",
    thumbnailDescription: "Primer plano de un teléfono fijo descolgado",
    research: "Investigación completa del caso X.",
    referenceScript: null,
    outlineSections: [
      {
        order: 1,
        workingTitle: "La llamada de las 3:14",
        openProblem: "Alguien marca al 911 y corta sin hablar.",
        payoffPreview: "La línea sigue abierta con ruido de fondo.",
        sourceNote: "Registro del 911.",
      },
    ],
    clarifications: [],
    ...overrides,
  };
}

describe("buildPayoffsStageTool", () => {
  it("is a strict tool", () => {
    const tool = buildPayoffsStageTool();
    expect(tool.strict).toBe(true);
    expect(tool.input_schema.additionalProperties).toBe(false);
  });

  it("does not set minItems/maxItems on payoffs (Anthropic strict tools only allow 0 or 1)", () => {
    const tool = buildPayoffsStageTool();
    const payoffsSchema = (
      tool.input_schema.properties as Record<string, { minItems?: number; maxItems?: number }>
    ).payoffs;
    expect(payoffsSchema.minItems).toBeUndefined();
    expect(payoffsSchema.maxItems).toBeUndefined();
  });
});

describe("buildToolChoice", () => {
  it("forces the generate_payoffs tool", () => {
    expect(buildToolChoice()).toEqual({ type: "tool", name: "generate_payoffs" });
  });
});

describe("buildMessages", () => {
  it("includes the outline sections", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("OUTLINE (secciones ordenadas)");
    expect(text).toContain("La llamada de las 3:14");
  });

  it("includes the chosen title, intro and research", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("La llamada que nadie contestó a tiempo");
    expect(text).toContain("Investigación completa del caso X.");
  });

  it("notes the absence of a reference script when none is given", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("No se proporcionó guion de referencia");
  });
});
