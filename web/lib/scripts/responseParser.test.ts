import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
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

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(join(process.cwd(), "lib/scripts/__fixtures__", name), "utf-8"));
}

describe("parseTitleStageOutput", () => {
  it("parses a valid GENERATE payload with exactly 5 candidates", () => {
    const result = parseTitleStageOutput(fixture("titleStage.generate.json"));
    expect(result.status).toBe("ok");
    if (result.status === "ok" && result.mode === "generate") {
      expect(result.candidates).toHaveLength(5);
    } else {
      throw new Error("expected mode=generate");
    }
  });

  it("parses a valid VALIDATE payload", () => {
    const result = parseTitleStageOutput(fixture("titleStage.validate.json"));
    expect(result.status).toBe("ok");
    if (result.status === "ok" && result.mode === "validate") {
      expect(result.assessment.alignmentVerdict).toBe("aligned");
    } else {
      throw new Error("expected mode=validate");
    }
  });

  it("parses a needs_input payload", () => {
    const result = parseTitleStageOutput(fixture("titleStage.needsInput.json"));
    expect(result.status).toBe("needs_input");
    if (result.status === "needs_input") {
      expect(result.question.length).toBeGreaterThan(0);
    }
  });

  it("throws when candidates has 4 items instead of 5", () => {
    const payload = fixture("titleStage.generate.json") as Record<string, unknown>;
    const bad = { ...payload, candidates: (payload.candidates as unknown[]).slice(0, 4) };
    expect(() => parseTitleStageOutput(bad)).toThrow(/candidates/);
  });

  it("throws when status is not ok/needs_input", () => {
    expect(() => parseTitleStageOutput({ status: "weird" })).toThrow(/status/);
  });

  it("throws when needs_input has an empty question", () => {
    expect(() => parseTitleStageOutput({ status: "needs_input", question: "" })).toThrow(
      /question/
    );
  });
});

describe("parseIntroStageOutput", () => {
  it("parses a valid payload with exactly 3 variations", () => {
    const result = parseIntroStageOutput(fixture("introStage.json"));
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.variations).toHaveLength(3);
      expect(result.variations.map((v) => v.angle).sort()).toEqual([
        "dato_sorprendente",
        "ironia",
        "miedo",
      ]);
    }
  });

  it("parses a needs_input payload", () => {
    const result = parseIntroStageOutput(fixture("introStage.needsInput.json"));
    expect(result.status).toBe("needs_input");
  });

  it("throws when variations has 2 items instead of 3", () => {
    const payload = fixture("introStage.json") as Record<string, unknown>;
    const bad = { ...payload, variations: (payload.variations as unknown[]).slice(0, 2) };
    expect(() => parseIntroStageOutput(bad)).toThrow(/variations/);
  });
});

describe("parseOutlineStageOutput", () => {
  it("parses a valid payload with 7 to 10 sections", () => {
    const result = parseOutlineStageOutput(fixture("outlineStage.json"));
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.sections.length).toBeGreaterThanOrEqual(7);
      expect(result.sections.length).toBeLessThanOrEqual(10);
    }
  });

  it("parses a needs_input payload", () => {
    const result = parseOutlineStageOutput(fixture("outlineStage.needsInput.json"));
    expect(result.status).toBe("needs_input");
  });

  it("throws when sections has 6 items (below the minimum of 7)", () => {
    const payload = fixture("outlineStage.json") as Record<string, unknown>;
    const bad = { ...payload, sections: (payload.sections as unknown[]).slice(0, 6) };
    expect(() => parseOutlineStageOutput(bad)).toThrow(/sections/);
  });
});

describe("parsePayoffsStageOutput", () => {
  it("parses a valid payload matching the expected count", () => {
    const result = parsePayoffsStageOutput(fixture("payoffsStage.json"), 7);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.payoffs).toHaveLength(7);
    }
  });

  it("parses a needs_input payload", () => {
    const result = parsePayoffsStageOutput(fixture("payoffsStage.needsInput.json"), 7);
    expect(result.status).toBe("needs_input");
  });

  it("throws when the count doesn't match the expected count", () => {
    expect(() => parsePayoffsStageOutput(fixture("payoffsStage.json"), 5)).toThrow(/payoffs/);
  });
});

describe("parseSectionStageOutput", () => {
  it("parses a single-variation payload", () => {
    const result = parseSectionStageOutput(fixture("sectionStage.single.json"), 1);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.variations).toHaveLength(1);
    }
  });

  it("parses a double-variation payload", () => {
    const result = parseSectionStageOutput(fixture("sectionStage.double.json"), 2);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.variations).toHaveLength(2);
    }
  });

  it("parses a needs_input payload", () => {
    const result = parseSectionStageOutput(fixture("sectionStage.needsInput.json"), 1);
    expect(result.status).toBe("needs_input");
  });

  it("throws when the count doesn't match the expected count", () => {
    expect(() => parseSectionStageOutput(fixture("sectionStage.single.json"), 2)).toThrow(
      /variations/
    );
  });
});

describe("parseTransitionsStageOutput", () => {
  it("parses a valid payload matching the expected junction count, each with 6 options", () => {
    const result = parseTransitionsStageOutput(fixture("transitionsStage.json"), 6);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.hooks).toHaveLength(6);
      result.hooks.forEach((h) => expect(h.options).toHaveLength(6));
    }
  });

  it("parses a needs_input payload", () => {
    const result = parseTransitionsStageOutput(fixture("transitionsStage.needsInput.json"), 6);
    expect(result.status).toBe("needs_input");
  });

  it("throws when a hook set has fewer than 6 options", () => {
    const payload = fixture("transitionsStage.json") as { hooks: Record<string, unknown>[] };
    const bad = {
      ...payload,
      hooks: [
        { ...payload.hooks[0], options: (payload.hooks[0].options as unknown[]).slice(0, 5) },
        ...payload.hooks.slice(1),
      ],
    };
    expect(() => parseTransitionsStageOutput(bad, 6)).toThrow(/options/);
  });

  it("throws when the junction count doesn't match the expected count", () => {
    expect(() => parseTransitionsStageOutput(fixture("transitionsStage.json"), 5)).toThrow(
      /hooks/
    );
  });
});

describe("parseCtasStageOutput", () => {
  it("parses a valid payload with exactly 3 CTAs", () => {
    const result = parseCtasStageOutput(fixture("ctasStage.json"));
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.ctas).toHaveLength(3);
      expect(result.ctas.map((c) => c.position).sort()).toEqual([
        "end_screen",
        "mid_script",
        "post_first_section",
      ]);
    }
  });

  it("parses a needs_input payload", () => {
    const result = parseCtasStageOutput(fixture("ctasStage.needsInput.json"));
    expect(result.status).toBe("needs_input");
  });

  it("throws when ctas has 2 items instead of 3", () => {
    const payload = fixture("ctasStage.json") as Record<string, unknown>;
    const bad = { ...payload, ctas: (payload.ctas as unknown[]).slice(0, 2) };
    expect(() => parseCtasStageOutput(bad)).toThrow(/ctas/);
  });
});

describe("parseStyleReviewStageOutput", () => {
  it("parses a valid payload with the 4 report categories", () => {
    const result = parseStyleReviewStageOutput(fixture("styleReviewStage.json"));
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.report.structuralChanges.length).toBeGreaterThan(0);
      expect(result.report.factualCorrections.length).toBeGreaterThan(0);
    }
  });

  it("parses a needs_input payload", () => {
    const result = parseStyleReviewStageOutput(fixture("styleReviewStage.needsInput.json"));
    expect(result.status).toBe("needs_input");
  });

  it("throws when a report category is not an array of strings", () => {
    const payload = fixture("styleReviewStage.json") as { report: Record<string, unknown> };
    const bad = { ...payload, report: { ...payload.report, styleChanges: "not an array" } };
    expect(() => parseStyleReviewStageOutput(bad)).toThrow(/styleChanges/);
  });
});
