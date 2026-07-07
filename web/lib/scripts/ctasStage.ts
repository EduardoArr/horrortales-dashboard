import type Anthropic from "@anthropic-ai/sdk";
import { VERACITY_RULE_TEXT, buildClarificationsBlock } from "./context";
import type { CtasStageInput } from "./types";

const TOOL_NAME = "generate_ctas";

export function buildCtasStageTool(): Anthropic.Tool {
  return {
    name: TOOL_NAME,
    description:
      "Decide dónde van los CTAs del guion (siempre 3: después de la primera sección, a mitad del guion, y end screen) y escribe su texto.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok", "needs_input"] },
        question: { type: ["string", "null"] },
        ctas: {
          type: ["array", "null"],
          items: {
            type: "object",
            properties: {
              position: {
                type: "string",
                enum: ["post_first_section", "mid_script", "end_screen"],
              },
              afterSectionOrder: { type: ["integer", "null"] },
              text: { type: "string" },
            },
            required: ["position", "afterSectionOrder", "text"],
            additionalProperties: false,
          },
        },
      },
      required: ["status", "question", "ctas"],
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

Leé el guion completo que te paso y decidí dónde van los CTAs sin cortar el flujo narrativo. \
Siempre son exactamente 3:
1. "post_first_section" — después de la primera sección (ya hubo confianza generada). \
"afterSectionOrder" = 1.
2. "mid_script" — entre el 40% y el 60% del guion (elegí vos el número de sección más cercano a \
ese rango según el total de secciones). "afterSectionOrder" = esa sección.
3. "end_screen" — al cierre del guion. "afterSectionOrder" = null.

Los CTAs usan el lenguaje natural del canal, nunca suenan a publicidad. Si no tenés información de \
qué producto, programa o servicio ofrecer, no lo inventes: respondé con status="needs_input" \
preguntando exactamente eso antes de escribir cualquier texto de CTA.`;
}

export function buildMessages(input: CtasStageInput): Anthropic.MessageParam[] {
  const parts: string[] = [];

  parts.push(`TÍTULO ELEGIDO: ${input.chosenTitle}`);
  parts.push(`CANTIDAD TOTAL DE SECCIONES: ${input.totalSections}`);
  parts.push("");
  parts.push("GUION COMPLETO (intro + secciones + transiciones, en orden):");
  parts.push(input.fullScriptText);

  const clarificationsBlock = buildClarificationsBlock(input.clarifications);
  if (clarificationsBlock) {
    parts.push("");
    parts.push(clarificationsBlock);
  }

  return [{ role: "user", content: parts.join("\n") }];
}
