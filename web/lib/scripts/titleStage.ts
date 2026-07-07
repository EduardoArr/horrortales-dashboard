import type Anthropic from "@anthropic-ai/sdk";
import { VERACITY_RULE_TEXT, buildClarificationsBlock } from "./context";
import type { TitleStageInput } from "./types";

const TOOL_NAME = "assess_or_generate_title";

/** Forced tool-use schema, `strict: true`: nullable fields use a
 *  ["type","null"] union and stay listed in `required` rather than being
 *  omitted, so every branch (validate/generate x ok/needs_input) still
 *  round-trips through one fixed shape. Deliberately no `minItems`/
 *  `maxItems` on `candidates` beyond 0/1 — the Anthropic API rejects strict
 *  tools that use them ("'minItems' values other than 0 or 1 are not
 *  supported"). The exact count (5) is enforced by the prompt text and by
 *  responseParser.ts's length check instead. */
export function buildTitleStageTool(): Anthropic.Tool {
  return {
    name: TOOL_NAME,
    description:
      "Valida el ángulo psicológico de un título+miniatura ya elegidos contra la investigación del caso, o genera 5 candidatos de título con ángulo asesino cuando todavía no hay título.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok", "needs_input"] },
        question: { type: ["string", "null"] },
        mode: { type: "string", enum: ["validate", "generate"] },
        assessment: {
          type: ["object", "null"],
          properties: {
            alignmentVerdict: { type: "string", enum: ["aligned", "misaligned"] },
            reasoning: { type: "string" },
            warning: { type: ["string", "null"] },
          },
          required: ["alignmentVerdict", "reasoning", "warning"],
          additionalProperties: false,
        },
        candidates: {
          type: ["array", "null"],
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              angle: { type: "string" },
              hook: { type: "string", enum: ["fascinacion", "indignacion", "perturbacion"] },
              reasoning: { type: "string" },
            },
            required: ["title", "angle", "hook", "reasoning"],
            additionalProperties: false,
          },
        },
      },
      required: ["status", "question", "mode", "assessment", "candidates"],
      additionalProperties: false,
    },
  };
}

export function buildToolChoice(): Anthropic.ToolChoice {
  return { type: "tool", name: TOOL_NAME };
}

export function buildSystemPrompt(): string {
  return `Sos un guionista senior de YouTube de un canal que sube historias reales (true crime / \
misterio) con documentación seria detrás. La credibilidad del canal se juega en la precisión de \
los datos.

${VERACITY_RULE_TEXT}

ÁNGULO ASESINO: no es el tema del video, es la TENSIÓN específica dentro del tema — la grieta \
concreta, casi nunca lo que el video trata literalmente (p. ej. no "un caso de desaparición" sino \
"por qué la policía cerró el caso sabiendo que la historia no cerraba"). Título y miniatura son la \
promesa psicológica del video: el guion entero tiene que sostener exactamente ese ángulo.

Tu tarea depende del campo "mode" del pedido:

- mode="validate": el usuario ya trae un título y una descripción de miniatura elegidos. Contrastá \
la promesa psicológica que prometen (fascinación, indignación o perturbación) contra la \
investigación: ¿los hechos documentados sostienen esa promesa? Si hay desajuste — el título \
promete algo que la investigación no respalda — devolvé alignmentVerdict="misaligned" y explicá en \
"warning" concretamente qué se promete vs. qué está documentado, SIN proponer un título \
alternativo (avisar, no forzar ni reescribir). Si el ajuste es correcto, alignmentVerdict="aligned" \
y warning=null.
- mode="generate": el usuario todavía no tiene título. Generá exactamente 5 candidatos, cada uno \
con un ángulo asesino distinto, basados ÚNICAMENTE en hechos explícitos de la investigación (nunca \
completes con lo que ya sepas del caso aunque te resulte familiar). Para cada uno indicá qué \
anzuelo psicológico activa: "fascinacion", "indignacion" o "perturbacion".

Si para completar esta etapa te falta un dato concreto de la investigación, respondé con \
status="needs_input" y una pregunta puntual sobre exactamente qué dato falta, dejando "assessment" \
y "candidates" en null.`;
}

export function buildMessages(input: TitleStageInput): Anthropic.MessageParam[] {
  const parts: string[] = [];

  parts.push(`MODO: ${input.mode === "VALIDATE" ? "validate" : "generate"}`);
  parts.push("");
  parts.push("INVESTIGACIÓN DEL CASO (única fuente de verdad):");
  parts.push(input.research);

  parts.push("");
  if (input.referenceScript) {
    parts.push(
      "GUION DE REFERENCIA DE LA COMPETENCIA (termómetro de estructura, no copiar frases ni ideas):"
    );
    parts.push(input.referenceScript);
  } else {
    parts.push("No se proporcionó guion de referencia de la competencia.");
  }

  parts.push("");
  parts.push(`DESCRIPCIÓN DE LA MINIATURA: ${input.thumbnailDescription}`);

  parts.push("");
  if (input.mode === "VALIDATE") {
    parts.push(`TÍTULO ELEGIDO: ${input.title}`);
  } else {
    parts.push("El usuario todavía no eligió título — generá los 5 candidatos.");
  }

  const clarificationsBlock = buildClarificationsBlock(input.clarifications);
  if (clarificationsBlock) {
    parts.push("");
    parts.push(clarificationsBlock);
  }

  return [{ role: "user", content: parts.join("\n") }];
}
