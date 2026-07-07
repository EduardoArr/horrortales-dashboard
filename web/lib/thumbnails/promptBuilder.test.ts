import { describe, expect, it } from "vitest";
import {
  buildThumbnailIdeaMessages,
  buildThumbnailIdeaTool,
  buildToolChoice,
} from "./promptBuilder";
import type { BuildPromptInput } from "./types";

function baseInput(overrides: Partial<BuildPromptInput> = {}): BuildPromptInput {
  return {
    ideaSource: { type: "freeform", text: "Un caso de desaparición sin resolver" },
    requestedHostFeature: "NONE",
    references: [],
    ...overrides,
  };
}

describe("buildThumbnailIdeaTool", () => {
  it("is a strict tool with additionalProperties false and all fields required", () => {
    const tool = buildThumbnailIdeaTool();
    expect(tool.strict).toBe(true);
    expect(tool.input_schema.additionalProperties).toBe(false);
    expect(tool.input_schema.required).toEqual([
      "angleCandidates",
      "chosenAngle",
      "referenceAnalysis",
      "titleCandidates",
      "chosenTitle",
      "thumbnailConcept",
      "imagePrompt",
    ]);
  });
});

describe("buildToolChoice", () => {
  it("forces the generate_thumbnail_idea tool", () => {
    expect(buildToolChoice()).toEqual({ type: "tool", name: "generate_thumbnail_idea" });
  });
});

describe("buildThumbnailIdeaMessages", () => {
  it("includes no image blocks when there are no references", () => {
    const messages = buildThumbnailIdeaMessages(baseInput());
    const content = messages[0].content;
    expect(Array.isArray(content)).toBe(true);
    const blocks = content as { type: string }[];
    expect(blocks.every((b) => b.type === "text")).toBe(true);
  });

  it("includes an image block only for references with a thumbnailUrl", () => {
    const messages = buildThumbnailIdeaMessages(
      baseInput({
        references: [
          {
            source: "outlier",
            id: "o1",
            title: "Ref with thumb",
            thumbnailUrl: "https://i.ytimg.com/vi/x/hq.jpg",
          },
          { source: "outlier", id: "o2", title: "Ref without thumb", thumbnailUrl: null },
        ],
      })
    );
    const blocks = messages[0].content as { type: string }[];
    const imageBlocks = blocks.filter((b) => b.type === "image");
    expect(imageBlocks).toHaveLength(1);
  });

  it("includes an image block for viral thumbnail references", () => {
    const messages = buildThumbnailIdeaMessages(
      baseInput({
        references: [
          {
            source: "viral",
            id: "v1",
            label: "Primer plano, contraste rojo/azul",
            thumbnailUrl: "https://example.public.blob.vercel-storage.com/viral.jpg",
          },
        ],
      })
    );
    const blocks = messages[0].content as { type: string; text?: string }[];
    const imageBlocks = blocks.filter((b) => b.type === "image");
    expect(imageBlocks).toHaveLength(1);
    const textBlock = blocks.find((b) => b.type === "text");
    expect(textBlock?.text).toContain("miniatura viral subida a mano");
    expect(textBlock?.text).toContain("Primer plano, contraste rojo/azul");
  });

  it("mentions the outlier title and description when the idea comes from an outlier", () => {
    const messages = buildThumbnailIdeaMessages(
      baseInput({
        ideaSource: {
          type: "outlier",
          outlierId: "o1",
          title: "El caso del faro abandonado",
          description: "Un guardián desapareció sin dejar rastro",
        },
      })
    );
    const textBlock = (messages[0].content as { type: string; text?: string }[]).find(
      (b) => b.type === "text"
    );
    expect(textBlock?.text).toContain("El caso del faro abandonado");
    expect(textBlock?.text).toContain("Un guardián desapareció sin dejar rastro");
  });

  it.each([
    ["NONE", "No debe aparecer ningún presentador"],
    ["HOST_1", "presentador 1"],
    ["HOST_2", "presentador 2"],
    ["BOTH", "ambos presentadores"],
  ] as const)("varies host-feature guidance for %s", (pref, expectedSubstring) => {
    const messages = buildThumbnailIdeaMessages(baseInput({ requestedHostFeature: pref }));
    const textBlock = (messages[0].content as { type: string; text?: string }[]).find(
      (b) => b.type === "text"
    );
    expect(textBlock?.text).toContain(expectedSubstring);
  });
});
