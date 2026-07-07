import { describe, expect, it } from "vitest";
import { buildMessages, buildTitleStageTool, buildToolChoice } from "./titleStage";
import type { TitleStageInput } from "./types";

function baseInput(overrides: Partial<TitleStageInput> = {}): TitleStageInput {
  return {
    mode: "GENERATE",
    title: null,
    thumbnailDescription: "Primer plano de una puerta entreabierta de noche",
    research: "Investigación completa del caso X.",
    referenceScript: null,
    clarifications: [],
    ...overrides,
  };
}

describe("buildTitleStageTool", () => {
  it("is a strict tool with additionalProperties false and all fields required", () => {
    const tool = buildTitleStageTool();
    expect(tool.strict).toBe(true);
    expect(tool.input_schema.additionalProperties).toBe(false);
    expect(tool.input_schema.required).toEqual([
      "status",
      "question",
      "mode",
      "assessment",
      "candidates",
    ]);
  });
});

describe("buildToolChoice", () => {
  it("forces the assess_or_generate_title tool", () => {
    expect(buildToolChoice()).toEqual({ type: "tool", name: "assess_or_generate_title" });
  });
});

describe("buildMessages", () => {
  it("tells the model to generate when no title was provided", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("MODO: generate");
    expect(text).toContain("todavía no eligió título");
  });

  it("includes the chosen title when mode is VALIDATE", () => {
    const messages = buildMessages(
      baseInput({ mode: "VALIDATE", title: "El silencio de la casa 42" })
    );
    const text = messages[0].content as string;
    expect(text).toContain("MODO: validate");
    expect(text).toContain("El silencio de la casa 42");
  });

  it("notes the absence of a reference script when none is given", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("No se proporcionó guion de referencia");
  });

  it("includes the reference script when provided", () => {
    const messages = buildMessages(baseInput({ referenceScript: "Guion de otro canal..." }));
    const text = messages[0].content as string;
    expect(text).toContain("Guion de otro canal...");
  });

  it("appends the clarifications block when clarifications exist", () => {
    const messages = buildMessages(
      baseInput({
        clarifications: [{ phase: "TITLE", question: "¿Fecha?", answer: "2019" }],
      })
    );
    const text = messages[0].content as string;
    expect(text).toContain("ACLARACIONES YA CONFIRMADAS POR EL USUARIO");
  });
});
