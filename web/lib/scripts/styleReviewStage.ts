import type Anthropic from "@anthropic-ai/sdk";
import { buildClarificationsBlock } from "./context";
import type { StyleReviewStageInput } from "./types";

const TOOL_NAME = "generate_style_guide_report";

export function buildStyleReviewStageTool(): Anthropic.Tool {
  return {
    name: TOOL_NAME,
    description:
      "Compara la versión generada del guion contra la edición final del usuario y produce un reporte de guía de estilo.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok", "needs_input"] },
        question: { type: ["string", "null"] },
        report: {
          type: ["object", "null"],
          properties: {
            structuralChanges: { type: "array", items: { type: "string" } },
            styleChanges: { type: "array", items: { type: "string" } },
            repeatedPatterns: { type: "array", items: { type: "string" } },
            factualCorrections: { type: "array", items: { type: "string" } },
          },
          required: [
            "structuralChanges",
            "styleChanges",
            "repeatedPatterns",
            "factualCorrections",
          ],
          additionalProperties: false,
        },
      },
      required: ["status", "question", "report"],
      additionalProperties: false,
    },
  };
}

export function buildToolChoice(): Anthropic.ToolChoice {
  return { type: "tool", name: TOOL_NAME };
}

export function buildSystemPrompt(): string {
  return `Sos un editor senior de guiones de YouTube de true crime / misterio, revisando cómo un \
usuario editó un guion que generaste.

Te paso la versión que generaste y la versión final editada por el usuario. Identificá los \
patrones de cambio y convertilos en reglas concretas y accionables (no descripciones vagas), \
agrupadas en 4 categorías:
- structuralChanges: qué reorganizó o cortó el usuario → regla concreta sobre estructura.
- styleChanges: qué frases reemplazó, qué tono ajustó → regla concreta de estilo.
- repeatedPatterns: errores o ajustes que aparecen más de una vez a lo largo del guion.
- factualCorrections: qué dato corrigió o eliminó por impreciso → regla concreta sobre qué tipo de \
afirmación evitar sin fuente en la investigación.

Cada entrada de cada lista tiene que ser una regla que sirva para el PRÓXIMO guion, no solo una \
observación de este ("evitá empezar secciones con la fecha exacta" en vez de "cambiaste la fecha \
de la sección 2"). Si alguna categoría no tiene cambios relevantes, devolvé un array vacío para \
esa categoría — no inventes cambios que no existen para completarla.`;
}

export function buildMessages(input: StyleReviewStageInput): Anthropic.MessageParam[] {
  const parts: string[] = [];

  parts.push("VERSIÓN GENERADA (antes de la edición del usuario):");
  parts.push(input.generatedScriptText);

  parts.push("");
  parts.push("VERSIÓN FINAL EDITADA POR EL USUARIO:");
  parts.push(input.editedFinalScript);

  const clarificationsBlock = buildClarificationsBlock(input.clarifications);
  if (clarificationsBlock) {
    parts.push("");
    parts.push(clarificationsBlock);
  }

  return [{ role: "user", content: parts.join("\n") }];
}
