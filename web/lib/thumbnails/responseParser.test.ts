import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseThumbnailIdeaOutput } from "./responseParser";

const validPayload = JSON.parse(
  readFileSync(
    join(process.cwd(), "lib/thumbnails/__fixtures__/generateThumbnailIdea.json"),
    "utf-8"
  )
);

describe("parseThumbnailIdeaOutput", () => {
  it("parses a valid payload into the expected shape", () => {
    const result = parseThumbnailIdeaOutput(validPayload);
    expect(result.angleCandidates).toHaveLength(5);
    expect(result.titleCandidates).toHaveLength(10);
    expect(result.thumbnailConcept.textOptions).toHaveLength(5);
    expect(result.chosenAngle).toBe(validPayload.chosenAngle);
    expect(result.chosenTitle).toBe(validPayload.chosenTitle);
    expect(result.imagePrompt).toBe(validPayload.imagePrompt);
    expect(result.referenceAnalysis).toBeNull();
  });

  it("parses referenceAnalysis when present", () => {
    const payload = {
      ...validPayload,
      referenceAnalysis: [
        {
          referenceId: "o1",
          mainPromise: "p",
          emotion: "e",
          dominantVisual: "v",
          whatIsShown: "s",
          whatIsHidden: "h",
          repeatingPattern: "r",
          compositionNotes: "c",
        },
      ],
    };
    const result = parseThumbnailIdeaOutput(payload);
    expect(result.referenceAnalysis).toHaveLength(1);
    expect(result.referenceAnalysis?.[0].referenceId).toBe("o1");
  });

  it("throws when angleCandidates has 4 items instead of 5", () => {
    const payload = { ...validPayload, angleCandidates: validPayload.angleCandidates.slice(0, 4) };
    expect(() => parseThumbnailIdeaOutput(payload)).toThrow(/angleCandidates/);
  });

  it("throws when titleCandidates has 9 items instead of 10", () => {
    const payload = { ...validPayload, titleCandidates: validPayload.titleCandidates.slice(0, 9) };
    expect(() => parseThumbnailIdeaOutput(payload)).toThrow(/titleCandidates/);
  });

  it("throws when imagePrompt is missing", () => {
    const payload = { ...validPayload };
    delete payload.imagePrompt;
    expect(() => parseThumbnailIdeaOutput(payload)).toThrow(/imagePrompt/);
  });

  it("throws when thumbnailConcept.textOptions has the wrong length", () => {
    const payload = {
      ...validPayload,
      thumbnailConcept: { ...validPayload.thumbnailConcept, textOptions: ["one", "two"] },
    };
    expect(() => parseThumbnailIdeaOutput(payload)).toThrow(/textOptions/);
  });

  it("throws when a field has the wrong type", () => {
    const payload = { ...validPayload, chosenTitle: 123 };
    expect(() => parseThumbnailIdeaOutput(payload)).toThrow(/chosenTitle/);
  });

  it("throws when the root value is not an object", () => {
    expect(() => parseThumbnailIdeaOutput("not an object")).toThrow(/root value/);
  });
});
