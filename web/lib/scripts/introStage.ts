import type Anthropic from "@anthropic-ai/sdk";
import { VERACITY_RULE_TEXT, buildClarificationsBlock } from "./context";
import type { IntroStageInput } from "./types";

const TOOL_NAME = "generate_intro_variations";

/** Deliberately no `minItems`/`maxItems` on `variations` beyond 0/1 — the
 *  Anthropic API rejects strict tools that use them ("'minItems' values
 *  other than 0 or 1 are not supported"). The exact count (3) is enforced
 *  by the prompt text and by responseParser.ts's length check instead. */
export function buildIntroStageTool(): Anthropic.Tool {
  return {
    name: TOOL_NAME,
    description:
      "Genera 3 variaciones de intro (miedo / ironía / dato sorprendente) para un video de true crime, cada una confirmando el click del título/miniatura y abriendo el loop principal.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok", "needs_input"] },
        question: { type: ["string", "null"] },
        variations: {
          type: ["array", "null"],
          items: {
            type: "object",
            properties: {
              angle: { type: "string", enum: ["miedo", "ironia", "dato_sorprendente"] },
              text: { type: "string" },
              wordCount: { type: "integer" },
              qaWarnings: { type: "array", items: { type: "string" } },
            },
            required: ["angle", "text", "wordCount", "qaWarnings"],
            additionalProperties: false,
          },
        },
      },
      required: ["status", "question", "variations"],
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

La intro tiene UN SOLO trabajo: confirmar el click y abrir el loop principal. En los primeros ~10 \
segundos tiene que: (1) confirmar la expectativa que generó el título/miniatura, y (2) abrir una \
pregunta más grande que la del título.

Generá exactamente 3 variaciones, una por cada ángulo: "miedo", "ironia", "dato_sorprendente". Cada \
una de máximo 100 palabras (reportá la cantidad real en wordCount). Todo dato que menciones tiene \
que salir de la investigación — si necesitás un dato de apertura fuerte y no está documentado, \
respondé con status="needs_input" en vez de inventarlo.

Antes de responder, autoaplicá este control de calidad a cada variación: ¿confirma el click en los \
primeros 10 segundos? ¿abre un loop de curiosidad? ¿suena como alguien que sabe exactamente adónde \
va con esta historia? ¿la primera oración obliga a leer la segunda? ¿hay frases genéricas tipo "en \
este video te voy a mostrar"? ¿todo dato mencionado está respaldado por la investigación? Si una \
variación falla por estilo, corregila directamente antes de responder — no expongas el borrador \
fallido. Si después de corregir queda algún matiz de calidad que valga la pena señalar, listalo en \
"qaWarnings" (array vacío si no hay ninguno). Si falla por falta de un dato concreto, no la \
fuerces: respondé needs_input.`;
}

export function buildMessages(input: IntroStageInput): Anthropic.MessageParam[] {
  const parts: string[] = [];

  parts.push(`TÍTULO ELEGIDO: ${input.chosenTitle}`);
  parts.push(`DESCRIPCIÓN DE LA MINIATURA: ${input.thumbnailDescription}`);

  parts.push("");
  parts.push("INVESTIGACIÓN DEL CASO (única fuente de verdad):");
  parts.push(input.research);

  parts.push("");
  if (input.referenceScript) {
    parts.push(
      "GUION DE REFERENCIA DE LA COMPETENCIA (termómetro de ritmo, no copiar frases ni ideas):"
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
