import type Anthropic from "@anthropic-ai/sdk";
import { VERACITY_RULE_TEXT, buildClarificationsBlock } from "./context";
import type { OutlineStageInput } from "./types";

const TOOL_NAME = "generate_outline";

/** Deliberately no `minItems`/`maxItems` on `sections` beyond 0/1 — the
 *  Anthropic API rejects strict tools that use them ("'minItems' values
 *  other than 0 or 1 are not supported"). The 7-10 range is enforced by the
 *  prompt text and by responseParser.ts's length check instead. */
export function buildOutlineStageTool(): Anthropic.Tool {
  return {
    name: TOOL_NAME,
    description:
      "Organiza la investigación y el brain dump del usuario en 7 a 10 secciones narrativas ordenadas para el cuerpo del guion.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok", "needs_input"] },
        question: { type: ["string", "null"] },
        sections: {
          type: ["array", "null"],
          items: {
            type: "object",
            properties: {
              order: { type: "integer" },
              workingTitle: { type: "string" },
              openProblem: { type: "string" },
              payoffPreview: { type: "string" },
              sourceNote: { type: "string" },
            },
            required: ["order", "workingTitle", "openProblem", "payoffPreview", "sourceNote"],
            additionalProperties: false,
          },
        },
      },
      required: ["status", "question", "sections"],
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

El usuario te da dos insumos que NO se reemplazan entre sí: la investigación (los hechos) y un \
"brain dump" (todo lo que sabe del tema, sin orden — te dice qué le importa más a él, no agrega \
hechos nuevos por sí solo). Si el guion de referencia de la competencia está presente, usalo como \
termómetro de qué estructura ya demostró retener audiencia — nunca como fuente de frases o ideas a \
copiar.

Organizá el material en entre 7 y 10 secciones narrativas ordenadas (campo "order" empezando en 1). \
Reglas de orden estrictas:
- Cada sección tiene que abrir un problema nuevo (openProblem) antes de cerrar el anterior.
- El segundo punto más interesante del caso va primero, el más interesante va segundo — no gastes \
la mejor carta de entrada en la sección 1.
- Ningún payoff (payoffPreview) se repite entre secciones.
- "sourceNote" indica brevemente en qué parte de la investigación o del brain dump se apoya esa \
sección, para poder rastrear cada afirmación después.

Si para armar una sección te falta un hecho que no está ni en la investigación ni en el brain dump, \
no lo inventes: respondé con status="needs_input" señalando exactamente qué hecho falta y para qué \
sección hacía falta.`;
}

export function buildMessages(input: OutlineStageInput): Anthropic.MessageParam[] {
  const parts: string[] = [];

  parts.push(`TÍTULO ELEGIDO: ${input.chosenTitle}`);
  parts.push(`INTRO ELEGIDA: ${input.chosenIntro}`);
  parts.push(`DESCRIPCIÓN DE LA MINIATURA: ${input.thumbnailDescription}`);

  parts.push("");
  parts.push("INVESTIGACIÓN DEL CASO (hechos):");
  parts.push(input.research);

  parts.push("");
  parts.push("BRAIN DUMP DEL USUARIO (prioridades, sin orden):");
  parts.push(input.brainDump);

  parts.push("");
  if (input.referenceScript) {
    parts.push(
      "GUION DE REFERENCIA DE LA COMPETENCIA (termómetro de estructura, no copiar frases ni ideas):"
    );
    parts.push(input.referenceScript);
  } else {
    parts.push("No se proporcionó guion de referencia de la competencia.");
  }

  const clarificationsBlock = buildClarificationsBlock(input.clarifications);
  if (clarificationsBlock) {
    parts.push("");
    parts.push(clarificationsBlock);
  }

  return [{ role: "user", content: parts.join("\n") }];
}
