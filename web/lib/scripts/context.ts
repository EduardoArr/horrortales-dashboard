import type { ScriptPhase } from "@prisma/client";
import type { ClarificationContext } from "./types";

/** Shared across the 3 stages: the one rule that outranks pacing/fluency.
 *  Never invent, complete from memory, or "round" a date/name/figure/quote
 *  that isn't explicit in the pasted research — pause and ask instead. */
export const VERACITY_RULE_TEXT = `REGLA DE VERACIDAD (pesa más que el ritmo o la fluidez): nunca inventes, \
completes de memoria ni "redondees" un dato — fecha, nombre, cifra, declaración, hecho — que no esté \
explícito en la investigación aportada, aunque el caso te resulte reconocible. Si para completar esta \
etapa te falta un dato concreto, no lo completes con algo plausible: respondé con status="needs_input" \
y una pregunta puntual sobre exactamente qué dato falta. Es preferible pausar a inventar.`;

const PHASE_LABEL: Record<ScriptPhase, string> = {
  TITLE: "Etapa 1 (Título)",
  INTRO: "Etapa 2 (Intro)",
  OUTLINE: "Etapa 3 (Outline)",
  PAYOFFS: "Etapa 4 (Payoffs)",
  SECTIONS: "Etapa 5 (Secciones)",
  TRANSITIONS: "Etapa 6 (Transiciones)",
  CTAS: "Etapa 7 (CTAs)",
  STYLE_REVIEW: "Etapa 8 (Feedback loop)",
  COMPLETE: "Completo",
};

/** Every stage call replays the full clarification history, not just the
 *  ones from its own phase — a fact confirmed in Etapa 1 is still true in
 *  Etapa 3. Returns "" when there's nothing to add. */
export function buildClarificationsBlock(clarifications: ClarificationContext[]): string {
  if (clarifications.length === 0) return "";
  const lines = clarifications.map(
    (c) => `- [${PHASE_LABEL[c.phase]}] P: ${c.question}\n  R: ${c.answer}`
  );
  return [
    "ACLARACIONES YA CONFIRMADAS POR EL USUARIO (tratalas como parte de la investigación):",
    ...lines,
  ].join("\n");
}
