import type { ScriptPhase } from "@prisma/client";

export interface ClarificationContext {
  phase: ScriptPhase;
  question: string;
  answer: string;
}

// Etapa 1 — título
export type TitleAlignmentVerdict = "aligned" | "misaligned";

export interface TitleAssessment {
  alignmentVerdict: TitleAlignmentVerdict;
  reasoning: string;
  warning: string | null;
}

export type TitleHook = "fascinacion" | "indignacion" | "perturbacion";

export interface TitleCandidate {
  title: string;
  angle: string;
  hook: TitleHook;
  reasoning: string;
}

export type TitleStageOutput =
  | { status: "needs_input"; question: string }
  | { status: "ok"; mode: "validate"; assessment: TitleAssessment }
  | { status: "ok"; mode: "generate"; candidates: TitleCandidate[] };

export interface TitleStageInput {
  mode: "VALIDATE" | "GENERATE";
  title: string | null;
  thumbnailDescription: string;
  research: string;
  referenceScript: string | null;
  clarifications: ClarificationContext[];
}

// Etapa 2 — intro
export type IntroAngle = "miedo" | "ironia" | "dato_sorprendente";

export interface IntroVariation {
  angle: IntroAngle;
  text: string;
  wordCount: number;
  qaWarnings: string[];
}

export type IntroStageOutput =
  | { status: "needs_input"; question: string }
  | { status: "ok"; variations: IntroVariation[] };

export interface IntroStageInput {
  chosenTitle: string;
  thumbnailDescription: string;
  research: string;
  referenceScript: string | null;
  clarifications: ClarificationContext[];
}

// Etapa 3 — outline
export interface OutlineSection {
  order: number;
  workingTitle: string;
  openProblem: string;
  payoffPreview: string;
  sourceNote: string;
}

export type OutlineStageOutput =
  | { status: "needs_input"; question: string }
  | { status: "ok"; sections: OutlineSection[] };

export interface OutlineStageInput {
  chosenTitle: string;
  chosenIntro: string;
  thumbnailDescription: string;
  research: string;
  referenceScript: string | null;
  brainDump: string;
  clarifications: ClarificationContext[];
}

// Etapa 4 — payoffs (uno por sección del outline, cantidad dinámica)
export interface PayoffItem {
  sectionOrder: number;
  question: string;
  payoff: string;
  sourceNote: string;
}

export type PayoffsStageOutput =
  | { status: "needs_input"; question: string }
  | { status: "ok"; payoffs: PayoffItem[] };

export interface PayoffsStageInput {
  chosenTitle: string;
  chosenIntro: string;
  thumbnailDescription: string;
  research: string;
  referenceScript: string | null;
  outlineSections: OutlineSection[];
  clarifications: ClarificationContext[];
}

// Etapa 5 — sección completa (se genera una por vez, no todas juntas)
export interface SectionVariation {
  text: string;
  wordCount: number;
}

export type SectionStageOutput =
  | { status: "needs_input"; question: string }
  | { status: "ok"; variations: SectionVariation[] };

export interface PreviousSectionContext {
  order: number;
  workingTitle: string;
  text: string;
}

export interface SectionStageInput {
  chosenTitle: string;
  chosenIntro: string;
  thumbnailDescription: string;
  research: string;
  referenceScript: string | null;
  order: number;
  totalSections: number;
  workingTitle: string;
  openProblem: string;
  payoffPreview: string;
  payoffText: string;
  payoffQuestion: string;
  previousSections: PreviousSectionContext[];
  wantsTwoVariations: boolean;
  clarifications: ClarificationContext[];
}

// Etapa 6 — hooks de transición (uno por unión entre secciones, N-1)
export interface TransitionHookSet {
  afterSectionOrder: number;
  options: string[];
  chosenIndex: number | null;
  chosenText: string | null;
}

export type TransitionsStageOutput =
  | { status: "needs_input"; question: string }
  | { status: "ok"; hooks: TransitionHookSet[] };

export interface SectionForTransition {
  order: number;
  workingTitle: string;
  text: string;
}

export interface TransitionsStageInput {
  chosenTitle: string;
  sections: SectionForTransition[];
  clarifications: ClarificationContext[];
}

// Etapa 7 — CTAs (siempre 3: post primera sección, mitad del guion, cierre)
export type CtaPosition = "post_first_section" | "mid_script" | "end_screen";

export interface CtaItem {
  position: CtaPosition;
  afterSectionOrder: number | null;
  text: string;
}

export type CtasStageOutput =
  | { status: "needs_input"; question: string }
  | { status: "ok"; ctas: CtaItem[] };

export interface CtasStageInput {
  chosenTitle: string;
  fullScriptText: string;
  totalSections: number;
  clarifications: ClarificationContext[];
}

// Etapa 8 — feedback loop (reporte, sin inyección automática todavía)
export interface StyleGuideReport {
  structuralChanges: string[];
  styleChanges: string[];
  repeatedPatterns: string[];
  factualCorrections: string[];
}

export type StyleReviewStageOutput =
  | { status: "needs_input"; question: string }
  | { status: "ok"; report: StyleGuideReport };

export interface StyleReviewStageInput {
  generatedScriptText: string;
  editedFinalScript: string;
  clarifications: ClarificationContext[];
}
