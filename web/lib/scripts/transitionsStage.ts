import type Anthropic from "@anthropic-ai/sdk";
import { VERACITY_RULE_TEXT, buildClarificationsBlock } from "./context";
import type { TransitionsStageInput } from "./types";

const TOOL_NAME = "generate_transition_hooks";

/** Deliberately no `minItems`/`maxItems` on `hooks`/`options` beyond 0/1 —
 *  the Anthropic API rejects strict tools that use them. The exact counts
 *  (N-1 junctions, 6 options each) are enforced by the prompt text and by
 *  responseParser.ts's length checks instead — this stage's parser takes
 *  the expected junction count as a second argument. */
export function buildTransitionsStageTool(): Anthropic.Tool {
  return {
    name: TOOL_NAME,
    description:
      "Genera 6 opciones de hook de transición para cada unión entre dos secciones consecutivas del guion.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok", "needs_input"] },
        question: { type: ["string", "null"] },
        hooks: {
          type: ["array", "null"],
          items: {
            type: "object",
            properties: {
              afterSectionOrder: { type: "integer" },
              options: { type: "array", items: { type: "string" } },
            },
            required: ["afterSectionOrder", "options"],
            additionalProperties: false,
          },
        },
      },
      required: ["status", "question", "hooks"],
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

Con todas las secciones del guion ya escritas, volvé a cada unión entre una sección y la siguiente. \
Para cada unión, tomá el final de la sección anterior y el inicio de la siguiente, y generá \
exactamente 6 opciones de hook de transición (máximo 2-3 oraciones cada una) que cierren el loop \
anterior retomando su mini-payoff y abran el siguiente con MÁS urgencia que el anterior.

Generá un set de 6 opciones por cada unión entre secciones consecutivas (si hay N secciones, son \
N-1 uniones — "afterSectionOrder" es el número de la sección que termina en esa unión).`;
}

export function buildMessages(input: TransitionsStageInput): Anthropic.MessageParam[] {
  const parts: string[] = [];

  parts.push(`TÍTULO ELEGIDO: ${input.chosenTitle}`);
  parts.push("");
  parts.push("SECCIONES DEL GUION, EN ORDEN:");
  input.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((s) => {
      parts.push(`--- Sección ${s.order}: ${s.workingTitle} ---`);
      parts.push(s.text);
    });

  const clarificationsBlock = buildClarificationsBlock(input.clarifications);
  if (clarificationsBlock) {
    parts.push("");
    parts.push(clarificationsBlock);
  }

  return [{ role: "user", content: parts.join("\n") }];
}
