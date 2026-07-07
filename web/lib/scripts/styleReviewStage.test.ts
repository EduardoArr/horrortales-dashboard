import { describe, expect, it } from "vitest";
import {
  buildMessages,
  buildStyleReviewStageTool,
  buildToolChoice,
} from "./styleReviewStage";
import type { StyleReviewStageInput } from "./types";

function baseInput(overrides: Partial<StyleReviewStageInput> = {}): StyleReviewStageInput {
  return {
    generatedScriptText: "Versión generada del guion completo.",
    editedFinalScript: "Versión final editada por el usuario.",
    clarifications: [],
    ...overrides,
  };
}

describe("buildStyleReviewStageTool", () => {
  it("is a strict tool with the 4 report categories required", () => {
    const tool = buildStyleReviewStageTool();
    expect(tool.strict).toBe(true);
    expect(tool.input_schema.additionalProperties).toBe(false);
    const reportSchema = (
      tool.input_schema.properties as Record<string, { required?: string[] }>
    ).report;
    expect(reportSchema.required).toEqual([
      "structuralChanges",
      "styleChanges",
      "repeatedPatterns",
      "factualCorrections",
    ]);
  });
});

describe("buildToolChoice", () => {
  it("forces the generate_style_guide_report tool", () => {
    expect(buildToolChoice()).toEqual({ type: "tool", name: "generate_style_guide_report" });
  });
});

describe("buildMessages", () => {
  it("includes both the generated and edited versions", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("VERSIÓN GENERADA");
    expect(text).toContain("Versión generada del guion completo.");
    expect(text).toContain("VERSIÓN FINAL EDITADA POR EL USUARIO");
    expect(text).toContain("Versión final editada por el usuario.");
  });
});
