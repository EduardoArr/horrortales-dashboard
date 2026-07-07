import type {
  CtaItem,
  CtasStageOutput,
  IntroStageOutput,
  IntroVariation,
  OutlineSection,
  OutlineStageOutput,
  PayoffItem,
  PayoffsStageOutput,
  SectionStageOutput,
  SectionVariation,
  StyleGuideReport,
  StyleReviewStageOutput,
  TitleAssessment,
  TitleCandidate,
  TitleStageOutput,
  TransitionHookSet,
  TransitionsStageOutput,
} from "./types";

function fail(stage: string, message: string): never {
  throw new Error(`Invalid ${stage} output: ${message}`);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function requireQuestion(stage: string, raw: Record<string, unknown>): string {
  const { question } = raw;
  if (!isString(question) || question.trim() === "") {
    fail(stage, `question must be a non-empty string when status is "needs_input"`);
  }
  return question;
}

function parseTitleCandidate(raw: unknown, index: number): TitleCandidate {
  if (!isRecord(raw)) fail("title stage", `candidates[${index}] is not an object`);
  const { title, angle, hook, reasoning } = raw;
  if (!isString(title)) fail("title stage", `candidates[${index}].title must be a string`);
  if (!isString(angle)) fail("title stage", `candidates[${index}].angle must be a string`);
  if (hook !== "fascinacion" && hook !== "indignacion" && hook !== "perturbacion") {
    fail("title stage", `candidates[${index}].hook must be fascinacion/indignacion/perturbacion`);
  }
  if (!isString(reasoning)) fail("title stage", `candidates[${index}].reasoning must be a string`);
  return { title, angle, hook, reasoning };
}

function parseTitleAssessment(raw: unknown): TitleAssessment {
  if (!isRecord(raw)) fail("title stage", "assessment is not an object");
  const { alignmentVerdict, reasoning, warning } = raw;
  if (alignmentVerdict !== "aligned" && alignmentVerdict !== "misaligned") {
    fail("title stage", "assessment.alignmentVerdict must be aligned/misaligned");
  }
  if (!isString(reasoning)) fail("title stage", "assessment.reasoning must be a string");
  if (warning !== null && !isString(warning)) {
    fail("title stage", "assessment.warning must be a string or null");
  }
  return { alignmentVerdict, reasoning, warning };
}

export function parseTitleStageOutput(raw: unknown): TitleStageOutput {
  if (!isRecord(raw)) fail("title stage", "root value is not an object");

  const { status, mode, assessment, candidates } = raw;
  if (status !== "ok" && status !== "needs_input") {
    fail("title stage", `status must be "ok" or "needs_input"`);
  }
  if (status === "needs_input") {
    return { status, question: requireQuestion("title stage", raw) };
  }

  if (mode !== "validate" && mode !== "generate") {
    fail("title stage", `mode must be "validate" or "generate"`);
  }
  if (mode === "validate") {
    if (assessment === null) fail("title stage", "assessment must not be null when mode=validate");
    return { status: "ok", mode, assessment: parseTitleAssessment(assessment) };
  }

  if (!Array.isArray(candidates) || candidates.length !== 5) {
    fail("title stage", "candidates must be an array of exactly 5 items when mode=generate");
  }
  return { status: "ok", mode, candidates: candidates.map(parseTitleCandidate) };
}

function parseIntroVariation(raw: unknown, index: number): IntroVariation {
  if (!isRecord(raw)) fail("intro stage", `variations[${index}] is not an object`);
  const { angle, text, wordCount, qaWarnings } = raw;
  if (angle !== "miedo" && angle !== "ironia" && angle !== "dato_sorprendente") {
    fail("intro stage", `variations[${index}].angle must be miedo/ironia/dato_sorprendente`);
  }
  if (!isString(text)) fail("intro stage", `variations[${index}].text must be a string`);
  if (!isNumber(wordCount)) fail("intro stage", `variations[${index}].wordCount must be a number`);
  if (!Array.isArray(qaWarnings) || !qaWarnings.every(isString)) {
    fail("intro stage", `variations[${index}].qaWarnings must be an array of strings`);
  }
  return { angle, text, wordCount, qaWarnings };
}

export function parseIntroStageOutput(raw: unknown): IntroStageOutput {
  if (!isRecord(raw)) fail("intro stage", "root value is not an object");

  const { status, variations } = raw;
  if (status !== "ok" && status !== "needs_input") {
    fail("intro stage", `status must be "ok" or "needs_input"`);
  }
  if (status === "needs_input") {
    return { status, question: requireQuestion("intro stage", raw) };
  }

  if (!Array.isArray(variations) || variations.length !== 3) {
    fail("intro stage", "variations must be an array of exactly 3 items");
  }
  return { status: "ok", variations: variations.map(parseIntroVariation) };
}

function parseOutlineSection(raw: unknown, index: number): OutlineSection {
  if (!isRecord(raw)) fail("outline stage", `sections[${index}] is not an object`);
  const { order, workingTitle, openProblem, payoffPreview, sourceNote } = raw;
  if (!isNumber(order)) fail("outline stage", `sections[${index}].order must be a number`);
  if (!isString(workingTitle)) fail("outline stage", `sections[${index}].workingTitle must be a string`);
  if (!isString(openProblem)) fail("outline stage", `sections[${index}].openProblem must be a string`);
  if (!isString(payoffPreview))
    fail("outline stage", `sections[${index}].payoffPreview must be a string`);
  if (!isString(sourceNote)) fail("outline stage", `sections[${index}].sourceNote must be a string`);
  return { order, workingTitle, openProblem, payoffPreview, sourceNote };
}

export function parseOutlineStageOutput(raw: unknown): OutlineStageOutput {
  if (!isRecord(raw)) fail("outline stage", "root value is not an object");

  const { status, sections } = raw;
  if (status !== "ok" && status !== "needs_input") {
    fail("outline stage", `status must be "ok" or "needs_input"`);
  }
  if (status === "needs_input") {
    return { status, question: requireQuestion("outline stage", raw) };
  }

  if (!Array.isArray(sections) || sections.length < 7 || sections.length > 10) {
    fail("outline stage", "sections must be an array of 7 to 10 items");
  }
  return { status: "ok", sections: sections.map(parseOutlineSection) };
}

function parsePayoffItem(raw: unknown, index: number): PayoffItem {
  if (!isRecord(raw)) fail("payoffs stage", `payoffs[${index}] is not an object`);
  const { sectionOrder, question, payoff, sourceNote } = raw;
  if (!isNumber(sectionOrder)) fail("payoffs stage", `payoffs[${index}].sectionOrder must be a number`);
  if (!isString(question)) fail("payoffs stage", `payoffs[${index}].question must be a string`);
  if (!isString(payoff)) fail("payoffs stage", `payoffs[${index}].payoff must be a string`);
  if (!isString(sourceNote)) fail("payoffs stage", `payoffs[${index}].sourceNote must be a string`);
  return { sectionOrder, question, payoff, sourceNote };
}

/** `expectedCount` is dynamic (one payoff per outline section), unlike the
 *  fixed 5/10/3 counts of the earlier stages — passed in by the caller
 *  instead of hardcoded here. */
export function parsePayoffsStageOutput(
  raw: unknown,
  expectedCount: number
): PayoffsStageOutput {
  if (!isRecord(raw)) fail("payoffs stage", "root value is not an object");

  const { status, payoffs } = raw;
  if (status !== "ok" && status !== "needs_input") {
    fail("payoffs stage", `status must be "ok" or "needs_input"`);
  }
  if (status === "needs_input") {
    return { status, question: requireQuestion("payoffs stage", raw) };
  }

  if (!Array.isArray(payoffs) || payoffs.length !== expectedCount) {
    fail("payoffs stage", `payoffs must be an array of exactly ${expectedCount} items`);
  }
  return { status: "ok", payoffs: payoffs.map(parsePayoffItem) };
}

function parseSectionVariation(raw: unknown, index: number): SectionVariation {
  if (!isRecord(raw)) fail("section stage", `variations[${index}] is not an object`);
  const { text, wordCount } = raw;
  if (!isString(text)) fail("section stage", `variations[${index}].text must be a string`);
  if (!isNumber(wordCount)) fail("section stage", `variations[${index}].wordCount must be a number`);
  return { text, wordCount };
}

/** `expectedVariations` is 1 or 2 depending on whether the caller requested
 *  `wantsTwoVariations` — not a fixed constant, so it's passed in. */
export function parseSectionStageOutput(
  raw: unknown,
  expectedVariations: number
): SectionStageOutput {
  if (!isRecord(raw)) fail("section stage", "root value is not an object");

  const { status, variations } = raw;
  if (status !== "ok" && status !== "needs_input") {
    fail("section stage", `status must be "ok" or "needs_input"`);
  }
  if (status === "needs_input") {
    return { status, question: requireQuestion("section stage", raw) };
  }

  if (!Array.isArray(variations) || variations.length !== expectedVariations) {
    fail("section stage", `variations must be an array of exactly ${expectedVariations} items`);
  }
  return { status: "ok", variations: variations.map(parseSectionVariation) };
}

function parseTransitionHookSet(raw: unknown, index: number): TransitionHookSet {
  if (!isRecord(raw)) fail("transitions stage", `hooks[${index}] is not an object`);
  const { afterSectionOrder, options } = raw;
  if (!isNumber(afterSectionOrder)) {
    fail("transitions stage", `hooks[${index}].afterSectionOrder must be a number`);
  }
  if (!Array.isArray(options) || options.length !== 6 || !options.every(isString)) {
    fail("transitions stage", `hooks[${index}].options must be an array of exactly 6 strings`);
  }
  return { afterSectionOrder, options, chosenIndex: null, chosenText: null };
}

/** `expectedJunctions` = number of sections - 1, passed in by the caller
 *  since it's dynamic per script. */
export function parseTransitionsStageOutput(
  raw: unknown,
  expectedJunctions: number
): TransitionsStageOutput {
  if (!isRecord(raw)) fail("transitions stage", "root value is not an object");

  const { status, hooks } = raw;
  if (status !== "ok" && status !== "needs_input") {
    fail("transitions stage", `status must be "ok" or "needs_input"`);
  }
  if (status === "needs_input") {
    return { status, question: requireQuestion("transitions stage", raw) };
  }

  if (!Array.isArray(hooks) || hooks.length !== expectedJunctions) {
    fail("transitions stage", `hooks must be an array of exactly ${expectedJunctions} items`);
  }
  return { status: "ok", hooks: hooks.map(parseTransitionHookSet) };
}

function parseCtaItem(raw: unknown, index: number): CtaItem {
  if (!isRecord(raw)) fail("ctas stage", `ctas[${index}] is not an object`);
  const { position, afterSectionOrder, text } = raw;
  if (
    position !== "post_first_section" &&
    position !== "mid_script" &&
    position !== "end_screen"
  ) {
    fail("ctas stage", `ctas[${index}].position must be post_first_section/mid_script/end_screen`);
  }
  if (afterSectionOrder !== null && !isNumber(afterSectionOrder)) {
    fail("ctas stage", `ctas[${index}].afterSectionOrder must be a number or null`);
  }
  if (!isString(text)) fail("ctas stage", `ctas[${index}].text must be a string`);
  return { position, afterSectionOrder, text };
}

export function parseCtasStageOutput(raw: unknown): CtasStageOutput {
  if (!isRecord(raw)) fail("ctas stage", "root value is not an object");

  const { status, ctas } = raw;
  if (status !== "ok" && status !== "needs_input") {
    fail("ctas stage", `status must be "ok" or "needs_input"`);
  }
  if (status === "needs_input") {
    return { status, question: requireQuestion("ctas stage", raw) };
  }

  if (!Array.isArray(ctas) || ctas.length !== 3) {
    fail("ctas stage", "ctas must be an array of exactly 3 items");
  }
  return { status: "ok", ctas: ctas.map(parseCtaItem) };
}

function parseStyleGuideReport(raw: unknown): StyleGuideReport {
  if (!isRecord(raw)) fail("style review stage", "report is not an object");
  const { structuralChanges, styleChanges, repeatedPatterns, factualCorrections } = raw;
  if (!Array.isArray(structuralChanges) || !structuralChanges.every(isString)) {
    fail("style review stage", "report.structuralChanges must be an array of strings");
  }
  if (!Array.isArray(styleChanges) || !styleChanges.every(isString)) {
    fail("style review stage", "report.styleChanges must be an array of strings");
  }
  if (!Array.isArray(repeatedPatterns) || !repeatedPatterns.every(isString)) {
    fail("style review stage", "report.repeatedPatterns must be an array of strings");
  }
  if (!Array.isArray(factualCorrections) || !factualCorrections.every(isString)) {
    fail("style review stage", "report.factualCorrections must be an array of strings");
  }
  return { structuralChanges, styleChanges, repeatedPatterns, factualCorrections };
}

export function parseStyleReviewStageOutput(raw: unknown): StyleReviewStageOutput {
  if (!isRecord(raw)) fail("style review stage", "root value is not an object");

  const { status, report } = raw;
  if (status !== "ok" && status !== "needs_input") {
    fail("style review stage", `status must be "ok" or "needs_input"`);
  }
  if (status === "needs_input") {
    return { status, question: requireQuestion("style review stage", raw) };
  }

  if (report === null) fail("style review stage", "report must not be null when status=ok");
  return { status: "ok", report: parseStyleGuideReport(report) };
}
