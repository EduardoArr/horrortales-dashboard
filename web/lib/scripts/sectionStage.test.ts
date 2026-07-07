import { describe, expect, it } from "vitest";
import { buildMessages, buildSectionStageTool, buildToolChoice } from "./sectionStage";
import type { SectionStageInput } from "./types";

function baseInput(overrides: Partial<SectionStageInput> = {}): SectionStageInput {
  return {
    chosenTitle: "La llamada que nadie contestó a tiempo",
    chosenIntro: "A las 3:14 de la madrugada, alguien marcó el 911 y colgó sin decir nada.",
    thumbnailDescription: "Primer plano de un teléfono fijo descolgado",
    research: "Investigación completa del caso X.",
    referenceScript: null,
    order: 1,
    totalSections: 7,
    workingTitle: "La llamada de las 3:14",
    openProblem: "Alguien marca al 911 y corta sin hablar.",
    payoffPreview: "La línea sigue abierta con ruido de fondo.",
    payoffText: "La línea queda abierta 40 segundos antes de perder la señal.",
    payoffQuestion: "¿Por qué corta la llamada sin decir nada?",
    previousSections: [],
    wantsTwoVariations: false,
    clarifications: [],
    ...overrides,
  };
}

describe("buildSectionStageTool", () => {
  it("is a strict tool", () => {
    const tool = buildSectionStageTool();
    expect(tool.strict).toBe(true);
    expect(tool.input_schema.additionalProperties).toBe(false);
  });

  it("does not set minItems/maxItems on variations (Anthropic strict tools only allow 0 or 1)", () => {
    const tool = buildSectionStageTool();
    const variationsSchema = (
      tool.input_schema.properties as Record<string, { minItems?: number; maxItems?: number }>
    ).variations;
    expect(variationsSchema.minItems).toBeUndefined();
    expect(variationsSchema.maxItems).toBeUndefined();
  });
});

describe("buildToolChoice", () => {
  it("forces the generate_section tool", () => {
    expect(buildToolChoice()).toEqual({ type: "tool", name: "generate_section" });
  });
});

describe("buildMessages", () => {
  it("includes this section's context (order, working title, payoff)", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("SECCIÓN 1 DE 7");
    expect(text).toContain("La llamada de las 3:14");
    expect(text).toContain("La línea queda abierta 40 segundos antes de perder la señal.");
  });

  it("notes there are no previous sections for the first section", () => {
    const messages = buildMessages(baseInput());
    const text = messages[0].content as string;
    expect(text).toContain("Esta es la primera sección del cuerpo del guion");
  });

  it("includes previous confirmed sections when present", () => {
    const messages = buildMessages(
      baseInput({
        order: 2,
        previousSections: [
          { order: 1, workingTitle: "La llamada de las 3:14", text: "Texto de la sección 1." },
        ],
      })
    );
    const text = messages[0].content as string;
    expect(text).toContain("SECCIONES ANTERIORES YA CONFIRMADAS");
    expect(text).toContain("Texto de la sección 1.");
  });

  it("reflects wantsTwoVariations in the message", () => {
    const messages = buildMessages(baseInput({ wantsTwoVariations: true }));
    const text = messages[0].content as string;
    expect(text).toContain("wantsTwoVariations: true");
  });
});
