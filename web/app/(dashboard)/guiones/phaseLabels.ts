import type { ScriptPhase } from "@prisma/client";

export const SCRIPT_PHASE_LABEL: Record<ScriptPhase, string> = {
  TITLE: "Título",
  INTRO: "Intro",
  OUTLINE: "Outline",
  PAYOFFS: "Payoffs",
  SECTIONS: "Secciones",
  TRANSITIONS: "Transiciones",
  CTAS: "CTAs",
  STYLE_REVIEW: "Feedback loop",
  COMPLETE: "Completo",
};

export const SCRIPT_PHASE_ORDER: ScriptPhase[] = [
  "TITLE",
  "INTRO",
  "OUTLINE",
  "PAYOFFS",
  "SECTIONS",
  "TRANSITIONS",
  "CTAS",
  "STYLE_REVIEW",
  "COMPLETE",
];

/** All 9 phases are implemented as of Ronda 2 (2026-07-04). Phases past
 *  this list would render a "Próximamente" placeholder in the wizard. */
export const IMPLEMENTED_PHASES: ScriptPhase[] = [
  "TITLE",
  "INTRO",
  "OUTLINE",
  "PAYOFFS",
  "SECTIONS",
  "TRANSITIONS",
  "CTAS",
  "STYLE_REVIEW",
  "COMPLETE",
];
