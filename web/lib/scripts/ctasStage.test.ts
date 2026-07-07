import { describe, expect, it } from "vitest";
import { buildMessages, buildCtasStageTool, buildToolChoice } from "./ctasStage";
import type { CtasStageInput } from "./types";

function baseInput(overrides: Partial<CtasStageInput> = {}): CtasStageInput {
  return {
    chosenTitle: "La llamada que nadie contestó a tiempo",
    fullScriptText: "Intro... Sección 1... Sección 2...",
    totalSections: 7,
    clarifications: [],
    ...overrides,
  };
}

describe("buildCtasStageTool", () => {
  it("is a strict tool requiring exactly 3 CTAs", () => {
    const tool = buildCtasStageTool();
    expect(tool.strict).toBe(true);
    expect(tool.input_schema.additionalProperties).toBe(false);
    expect(tool.input_schema.required).toEqual(["status", "question", "ctas"]);
  });
});

describe("buildToolChoice", () => {
  it("forces the generate_ctas tool", () => {
    expect(buildToolChoice()).toEqual({ type: "tool", name: "generate_ctas" });
  });
});

describe("buildMessages", () => {
  it("includes the full script text and section count", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("GUION COMPLETO");
    expect(text).toContain("Intro... Sección 1... Sección 2...");
    expect(text).toContain("CANTIDAD TOTAL DE SECCIONES: 7");
  });

  it("includes the chosen title", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("La llamada que nadie contestó a tiempo");
  });
});
