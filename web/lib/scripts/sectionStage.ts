import type Anthropic from "@anthropic-ai/sdk";
import { VERACITY_RULE_TEXT, buildClarificationsBlock } from "./context";
import type { SectionStageInput } from "./types";

const TOOL_NAME = "generate_section";

/** Deliberately no `minItems`/`maxItems` on `variations` beyond 0/1 — the
 *  Anthropic API rejects strict tools that use them. The exact count (1 or
 *  2, per `wantsTwoVariations`) is enforced by the prompt text and by
 *  responseParser.ts's length check instead — this stage's parser takes the
 *  expected count as a second argument since it isn't a fixed constant like
 *  the other stages. */
export function buildSectionStageTool(): Anthropic.Tool {
  return {
    name: TOOL_NAME,
    description:
      "Escribe el texto completo de UNA sección del guion (no todas juntas), aplicando el framework de 6 pasos.",
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
              text: { type: "string" },
              wordCount: { type: "integer" },
            },
            required: ["text", "wordCount"],
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

Escribí el texto COMPLETO de una sola sección del guion (no las demás), aplicando en este orden \
estricto el framework de 6 pasos:
1. GANCHO NARRATIVO — la imagen, escena o dato más perturbador de ESTA sección, lanzado sin \
contexto. No expliques nada todavía. Que el viewer no entienda del todo qué está pasando pero no \
pueda mirar hacia otro lado.
2. PREGUNTA SIN RESPUESTA — cerrá el bloque del gancho con una pregunta que el viewer no puede \
responder todavía. No la contestes. Dejala abierta.
3. IRONÍA (si aplica) — el giro inesperado o contradicción que hace el tema más interesante de lo \
que parecía.
4. INFORMACIÓN/SOLUCIÓN — desarrollá el contenido. Una idea por oración, sin relleno, sin repetir \
lo ya dicho en secciones anteriores.
5. MINI-PAYOFF — cerrá entregando el payoff de esta sección (te lo paso ya definido, usalo tal cual \
o parafraseado, nunca contradicho).
6. REHOOK — última línea de la sección. Cerrá el loop actual y abrí el siguiente con MÁS urgencia \
que el anterior (salvo que sea la última sección del guion).

Estilo: frases cortas, ritmo oral, cero relleno, nada de "en el mundo actual" ni conclusiones \
vacías ni frases tipo "básicamente"/"como dijimos"/"en resumen". Cada hecho, fecha, nombre o cifra \
tiene que poder rastrearse a la investigación — si necesitás un dato que no tenés, no lo completes \
con algo verosímil: respondé con status="needs_input".

Control de calidad antes de responder (corregilo vos mismo si falla algo de estilo; si falla por un \
dato no verificado, preguntá en vez de corregir): ¿queda claro cómo llegó a pasar esto? ¿hay \
pregunta sin respuesta? ¿la información va después del gancho, no antes? ¿el payoff responde la \
pregunta abierta? ¿el rehook sube la urgencia? ¿repetís algo ya dicho en una sección anterior?

Si wantsTwoVariations es true, generá 2 variaciones distintas de la sección completa (mismo \
contenido factual, distinto enfoque de estilo/ritmo); si es false, generá solo 1.`;
}

export function buildMessages(input: SectionStageInput): Anthropic.MessageParam[] {
  const parts: string[] = [];

  parts.push(`TÍTULO ELEGIDO: ${input.chosenTitle}`);
  parts.push(`INTRO ELEGIDA: ${input.chosenIntro}`);
  parts.push(`DESCRIPCIÓN DE LA MINIATURA: ${input.thumbnailDescription}`);
  parts.push(`SECCIÓN ${input.order} DE ${input.totalSections}`);

  parts.push("");
  parts.push("INVESTIGACIÓN DEL CASO (hechos):");
  parts.push(input.research);

  parts.push("");
  if (input.referenceScript) {
    parts.push("GUION DE REFERENCIA DE LA COMPETENCIA (termómetro de ritmo, no copiar frases):");
    parts.push(input.referenceScript);
  } else {
    parts.push("No se proporcionó guion de referencia de la competencia.");
  }

  parts.push("");
  parts.push("ESTA SECCIÓN (del outline):");
  parts.push(`Título de trabajo: ${input.workingTitle}`);
  parts.push(`Abre (openProblem): ${input.openProblem}`);
  parts.push(`Payoff previsto (outline): ${input.payoffPreview}`);
  parts.push(`Pregunta que antecede el payoff (Etapa 4): ${input.payoffQuestion}`);
  parts.push(`Payoff confirmado (Etapa 4, usalo tal cual o parafraseado): ${input.payoffText}`);

  if (input.previousSections.length > 0) {
    parts.push("");
    parts.push("SECCIONES ANTERIORES YA CONFIRMADAS (no repitas payoffs ni frases de estas):");
    input.previousSections.forEach((s) => {
      parts.push(`--- Sección ${s.order}: ${s.workingTitle} ---`);
      parts.push(s.text);
    });
  } else {
    parts.push("");
    parts.push("Esta es la primera sección del cuerpo del guion (no hay secciones anteriores).");
  }

  parts.push("");
  parts.push(`wantsTwoVariations: ${input.wantsTwoVariations}`);

  const clarificationsBlock = buildClarificationsBlock(input.clarifications);
  if (clarificationsBlock) {
    parts.push("");
    parts.push(clarificationsBlock);
  }

  return [{ role: "user", content: parts.join("\n") }];
}
