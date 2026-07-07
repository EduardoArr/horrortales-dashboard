import type {
  AngleCandidate,
  ReferenceAnalysis,
  ThumbnailConcept,
  ThumbnailIdeaGenerationOutput,
  TitleCandidate,
} from "./types";

function fail(message: string): never {
  throw new Error(`Invalid thumbnail idea generation output: ${message}`);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseAngleCandidate(raw: unknown, index: number): AngleCandidate {
  if (!isRecord(raw)) fail(`angleCandidates[${index}] is not an object`);
  const { angle, whyItWorks, recommended } = raw;
  if (!isString(angle)) fail(`angleCandidates[${index}].angle must be a string`);
  if (!isString(whyItWorks)) fail(`angleCandidates[${index}].whyItWorks must be a string`);
  if (!isBoolean(recommended)) fail(`angleCandidates[${index}].recommended must be a boolean`);
  return { angle, whyItWorks, recommended };
}

function parseReferenceAnalysis(raw: unknown, index: number): ReferenceAnalysis {
  if (!isRecord(raw)) fail(`referenceAnalysis[${index}] is not an object`);
  const {
    referenceId,
    mainPromise,
    emotion,
    dominantVisual,
    whatIsShown,
    whatIsHidden,
    repeatingPattern,
    compositionNotes,
  } = raw;
  if (!isString(referenceId)) fail(`referenceAnalysis[${index}].referenceId must be a string`);
  if (!isString(mainPromise)) fail(`referenceAnalysis[${index}].mainPromise must be a string`);
  if (!isString(emotion)) fail(`referenceAnalysis[${index}].emotion must be a string`);
  if (!isString(dominantVisual))
    fail(`referenceAnalysis[${index}].dominantVisual must be a string`);
  if (!isString(whatIsShown)) fail(`referenceAnalysis[${index}].whatIsShown must be a string`);
  if (!isString(whatIsHidden)) fail(`referenceAnalysis[${index}].whatIsHidden must be a string`);
  if (!isString(repeatingPattern))
    fail(`referenceAnalysis[${index}].repeatingPattern must be a string`);
  if (!isString(compositionNotes))
    fail(`referenceAnalysis[${index}].compositionNotes must be a string`);
  return {
    referenceId,
    mainPromise,
    emotion,
    dominantVisual,
    whatIsShown,
    whatIsHidden,
    repeatingPattern,
    compositionNotes,
  };
}

function parseTitleCandidate(raw: unknown, index: number): TitleCandidate {
  if (!isRecord(raw)) fail(`titleCandidates[${index}] is not an object`);
  const { title, triggerNote, ctrRank, isTopThree } = raw;
  if (!isString(title)) fail(`titleCandidates[${index}].title must be a string`);
  if (!isString(triggerNote)) fail(`titleCandidates[${index}].triggerNote must be a string`);
  if (!isNumber(ctrRank)) fail(`titleCandidates[${index}].ctrRank must be a number`);
  if (!isBoolean(isTopThree)) fail(`titleCandidates[${index}].isTopThree must be a boolean`);
  return { title, triggerNote, ctrRank, isTopThree };
}

function parseThumbnailConcept(raw: unknown): ThumbnailConcept {
  if (!isRecord(raw)) fail(`thumbnailConcept is not an object`);
  const {
    mainVisualElement,
    facialExpression,
    colorContrastNote,
    withheldInfo,
    complementRuleNote,
    textOptions,
  } = raw;
  if (!isString(mainVisualElement)) fail(`thumbnailConcept.mainVisualElement must be a string`);
  if (facialExpression !== null && !isString(facialExpression)) {
    fail(`thumbnailConcept.facialExpression must be a string or null`);
  }
  if (!isString(colorContrastNote)) fail(`thumbnailConcept.colorContrastNote must be a string`);
  if (!isString(withheldInfo)) fail(`thumbnailConcept.withheldInfo must be a string`);
  if (!isString(complementRuleNote))
    fail(`thumbnailConcept.complementRuleNote must be a string`);
  if (!Array.isArray(textOptions) || textOptions.length !== 5 || !textOptions.every(isString)) {
    fail(`thumbnailConcept.textOptions must be an array of exactly 5 strings`);
  }
  return {
    mainVisualElement,
    facialExpression,
    colorContrastNote,
    withheldInfo,
    complementRuleNote,
    textOptions: textOptions as string[],
  };
}

export function parseThumbnailIdeaOutput(raw: unknown): ThumbnailIdeaGenerationOutput {
  if (!isRecord(raw)) fail("root value is not an object");

  const {
    angleCandidates,
    chosenAngle,
    referenceAnalysis,
    titleCandidates,
    chosenTitle,
    thumbnailConcept,
    imagePrompt,
  } = raw;

  if (!Array.isArray(angleCandidates) || angleCandidates.length !== 5) {
    fail("angleCandidates must be an array of exactly 5 items");
  }
  if (!isString(chosenAngle)) fail("chosenAngle must be a string");

  if (referenceAnalysis !== null && !Array.isArray(referenceAnalysis)) {
    fail("referenceAnalysis must be an array or null");
  }
  const parsedReferenceAnalysis: ReferenceAnalysis[] | null =
    referenceAnalysis === null
      ? null
      : (referenceAnalysis as unknown[]).map(parseReferenceAnalysis);

  if (!Array.isArray(titleCandidates) || titleCandidates.length !== 10) {
    fail("titleCandidates must be an array of exactly 10 items");
  }
  if (!isString(chosenTitle)) fail("chosenTitle must be a string");
  if (!isString(imagePrompt)) fail("imagePrompt must be a string");

  return {
    angleCandidates: angleCandidates.map(parseAngleCandidate),
    chosenAngle,
    referenceAnalysis: parsedReferenceAnalysis,
    titleCandidates: titleCandidates.map(parseTitleCandidate),
    chosenTitle,
    thumbnailConcept: parseThumbnailConcept(thumbnailConcept),
    imagePrompt,
  };
}
