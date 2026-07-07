import { describe, expect, it } from "vitest";
import { buildMessages, buildOutlineStageTool, buildToolChoice } from "./outlineStage";
import type { OutlineStageInput } from "./types";

function baseInput(overrides: Partial<OutlineStageInput> = {}): OutlineStageInput {
  return {
    chosenTitle: "La llamada que nadie contestó a tiempo",
    chosenIntro: "A las 3:14 de la madrugada, alguien marcó el 911 y colgó sin decir nada.",
    thumbnailDescription: "Primer plano de un teléfono fijo descolgado",
    research: "Investigación completa del caso X.",
    referenceScript: null,
    brainDump: "Lo que más me llamó la atención fue la demora de la policía.",
    clarifications: [],
    ...overrides,
  };
}

describe("buildOutlineStageTool", () => {
  it("is a strict tool", () => {
    const tool = buildOutlineStageTool();
    expect(tool.strict).toBe(true);
    expect(tool.input_schema.additionalProperties).toBe(false);
  });

  it("does not set minItems/maxItems on sections (Anthropic strict tools only allow 0 or 1)", () => {
    const tool = buildOutlineStageTool();
    const sectionsSchema = (
      tool.input_schema.properties as Record<string, { minItems?: number; maxItems?: number }>
    ).sections;
    expect(sectionsSchema.minItems).toBeUndefined();
    expect(sectionsSchema.maxItems).toBeUndefined();
  });
});

describe("buildToolChoice", () => {
  it("forces the generate_outline tool", () => {
    expect(buildToolChoice()).toEqual({ type: "tool", name: "generate_outline" });
  });
});

describe("buildMessages", () => {
  it("includes the brain dump and research separately", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("BRAIN DUMP DEL USUARIO");
    expect(text).toContain("Lo que más me llamó la atención fue la demora de la policía.");
    expect(text).toContain("INVESTIGACIÓN DEL CASO");
    expect(text).toContain("Investigación completa del caso X.");
  });

  it("notes the absence of a reference script when none is given", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("No se proporcionó guion de referencia");
  });

  it("includes the chosen title and intro", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("La llamada que nadie contestó a tiempo");
    expect(text).toContain("A las 3:14 de la madrugada");
  });
});
