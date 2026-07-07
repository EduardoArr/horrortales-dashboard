import { describe, expect, it } from "vitest";
import { buildClarificationsBlock } from "./context";

describe("buildClarificationsBlock", () => {
  it("returns an empty string when there are no clarifications", () => {
    expect(buildClarificationsBlock([])).toBe("");
  });

  it("labels each clarification with its phase and preserves chronological order", () => {
    const block = buildClarificationsBlock([
      { phase: "TITLE", question: "¿Fecha exacta?", answer: "12 de marzo de 2019" },
      { phase: "OUTLINE", question: "¿Qué encontró el vecino?", answer: "Un diario personal" },
    ]);
    expect(block).toContain("Etapa 1 (Título)");
    expect(block).toContain("¿Fecha exacta?");
    expect(block).toContain("12 de marzo de 2019");
    expect(block).toContain("Etapa 3 (Outline)");
    expect(block.indexOf("Fecha exacta")).toBeLessThan(block.indexOf("Qué encontró el vecino"));
  });
});
