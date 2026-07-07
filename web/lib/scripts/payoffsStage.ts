import type Anthropic from "@anthropic-ai/sdk";
import { VERACITY_RULE_TEXT, buildClarificationsBlock } from "./context";
import type { PayoffsStageInput } from "./types";

const TOOL_NAME = "generate_payoffs";

/** Deliberately no `minItems`/`maxItems` on `payoffs` beyond 0/1 — the
 *  Anthropic API rejects strict tools that use them ("'minItems' values
 *  other than 0 or 1 are not supported"). The exact count (one per outline
 *  section) is enforced by the prompt text and by responseParser.ts's
 *  length check instead. */
export function buildPayoffsStageTool(): Anthropic.Tool {
  return {
    name: TOOL_NAME,
    description:
      "Genera, para cada sección del outline, el payoff (1-2 oraciones) y la pregunta que lo antecede.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok", "needs_input"] },
        question: { type: ["string", "null"] },
        payoffs: {
          type: ["array", "null"],
          items: {
            type: "object",
            properties: {
              sectionOrder: { type: "integer" },
              question: { type: "string" },
              payoff: { type: "string" },
              sourceNote: { type: "string" },
            },
            required: ["sectionOrder", "question", "payoff", "sourceNote"],
            additionalProperties: false,
          },
        },
      },
      required: ["status", "question", "payoffs"],
      additionalProperties: false,
    },
  };
}

export function buildToolChoice(): Anthropic.ToolChoice {
  return { type: "tool", name: TOOL_NAME };
}

export function buildSystemPrompt(): string {
  return `Sos un guionista senior de YouTube de un canal de true crime / misterio con documentación \
seria detrás.

${VERACITY_RULE_TEXT}

Antes de escribir las secciones completas, para CADA sección del outline escribí SOLO el payoff \
(1-2 oraciones: el momento donde el viewer recibe lo que vino a buscar) y la pregunta que lo \
antecede (el "question" de esa sección — no necesariamente literal al openProblem del outline, \
pero coherente con él).

Reglas:
- Cada payoff tiene que anclarse en un hecho concreto de la investigación — si depende de un dato \
que no está documentado ni en la investigación ni en el guion de referencia, respondé con \
status="needs_input" señalando exactamente qué dato falta y para qué sección.
- Si notás que un payoff te está saliendo débil o repetido respecto a otro ya escrito en esta misma \
respuesta, corregilo vos mismo antes de responder — no tiene sentido dejar pasar un payoff flojo. \
No preguntes por esto, solo corregilo (a diferencia de un dato faltante, que sí amerita preguntar).
- "sourceNote" indica brevemente en qué parte de la investigación se apoya ese payoff.
- Generá exactamente un payoff por cada sección del outline que te paso, usando el mismo "order" \
como "sectionOrder".`;
}

export function buildMessages(input: PayoffsStageInput): Anthropic.MessageParam[] {
  const parts: string[] = [];

  parts.push(`TÍTULO ELEGIDO: ${input.chosenTitle}`);
  parts.push(`INTRO ELEGIDA: ${input.chosenIntro}`);
  parts.push(`DESCRIPCIÓN DE LA MINIATURA: ${input.thumbnailDescription}`);

  parts.push("");
  parts.push("INVESTIGACIÓN DEL CASO (hechos):");
  parts.push(input.research);

  parts.push("");
  if (input.referenceScript) {
    parts.push("GUION DE REFERENCIA DE LA COMPETENCIA (no copiar frases ni ideas):");
    parts.push(input.referenceScript);
  } else {
    parts.push("No se proporcionó guion de referencia de la competencia.");
  }

  parts.push("");
  parts.push("OUTLINE (secciones ordenadas):");
  input.outlineSections
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((s) => {
      parts.push(
        `${s.order}. ${s.workingTitle} — abre: ${s.openProblem} — payoff previsto: ${s.payoffPreview} — fuente: ${s.sourceNote}`
      );
    });

  const clarificationsBlock = buildClarificationsBlock(input.clarifications);
  if (clarificationsBlock) {
    parts.push("");
    parts.push(clarificationsBlock);
  }

  return [{ role: "user", content: parts.join("\n") }];
}
