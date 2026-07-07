import type Anthropic from "@anthropic-ai/sdk";
import type { BuildPromptInput, HostFeaturePreference } from "./types";

const TOOL_NAME = "generate_thumbnail_idea";

/** Forced tool-use schema. `strict: true` requires every property listed in
 *  `required` at every object level (nullable fields use a ["type","null"]
 *  union instead of being omitted from `required`) so the model's output is
 *  guaranteed to match lib/thumbnails/types.ts's ThumbnailIdeaGenerationOutput
 *  without a lenient parsing pass. Deliberately no `minItems`/`maxItems` on
 *  arrays beyond 0/1 — the Anthropic API rejects strict tools that use them
 *  ("'minItems' values other than 0 or 1 are not supported"). Exact counts
 *  (5 angles, 10 titles, 5 text options) are enforced by the prompt text and
 *  by responseParser.ts's length checks instead. */
export function buildThumbnailIdeaTool(): Anthropic.Tool {
  return {
    name: TOOL_NAME,
    description:
      "Generates the full título/miniatura package for a horror/true-crime video idea: killer angle candidates, ranked titles, thumbnail concept, and an image-generation prompt.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        angleCandidates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              angle: { type: "string" },
              whyItWorks: { type: "string" },
              recommended: { type: "boolean" },
            },
            required: ["angle", "whyItWorks", "recommended"],
            additionalProperties: false,
          },
        },
        chosenAngle: { type: "string" },
        referenceAnalysis: {
          type: ["array", "null"],
          items: {
            type: "object",
            properties: {
              outlierId: { type: "string" },
              mainPromise: { type: "string" },
              emotion: { type: "string" },
              dominantVisual: { type: "string" },
              whatIsShown: { type: "string" },
              whatIsHidden: { type: "string" },
              repeatingPattern: { type: "string" },
            },
            required: [
              "outlierId",
              "mainPromise",
              "emotion",
              "dominantVisual",
              "whatIsShown",
              "whatIsHidden",
              "repeatingPattern",
            ],
            additionalProperties: false,
          },
        },
        titleCandidates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              triggerNote: { type: "string" },
              ctrRank: { type: "integer" },
              isTopThree: { type: "boolean" },
            },
            required: ["title", "triggerNote", "ctrRank", "isTopThree"],
            additionalProperties: false,
          },
        },
        chosenTitle: { type: "string" },
        thumbnailConcept: {
          type: "object",
          properties: {
            mainVisualElement: { type: "string" },
            facialExpression: { type: ["string", "null"] },
            colorContrastNote: { type: "string" },
            withheldInfo: { type: "string" },
            complementRuleNote: { type: "string" },
            textOptions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "mainVisualElement",
            "facialExpression",
            "colorContrastNote",
            "withheldInfo",
            "complementRuleNote",
            "textOptions",
          ],
          additionalProperties: false,
        },
        imagePrompt: { type: "string" },
      },
      required: [
        "angleCandidates",
        "chosenAngle",
        "referenceAnalysis",
        "titleCandidates",
        "chosenTitle",
        "thumbnailConcept",
        "imagePrompt",
      ],
      additionalProperties: false,
    },
  };
}

export function buildToolChoice(): Anthropic.ToolChoice {
  return { type: "tool", name: TOOL_NAME };
}

export function buildSystemPrompt(): string {
  return `Sos el director de packaging de un canal de YouTube de true crime / misterio / \
supervivencia extrema narrado (casos reales: desapariciones, crímenes reales, casos del \
FBI, paranormal real, descensos a la locura, asesinos jóvenes — nunca ficción ni \
creepypastas). El canal tiene dos presentadores reales que a veces aparecen en la \
miniatura y a veces no, a diferencia de un canal faceless.

Trabajás en dos conceptos:

ÁNGULO ASESINO: no es el tema del video, es la TENSIÓN dentro del tema — la grieta \
específica, no "un caso de desaparición" sino "por qué la policía cerró el caso sabiendo \
que la historia no cerraba". Normalmente esa tensión NO es lo que el video trata \
literalmente — pero si la premisa literal ya trae un dato hiperespecífico, visceral o \
inesperado (una cifra concreta, una frase textual, un detalle que por sí solo genera \
rechazo o shock), ESE dato es el ángulo más fuerte posible y no hay que reemplazarlo por \
una reformulación abstracta genérica (tipo "una institución oculta la verdad") solo por \
alejarse de lo literal.

REGLA DE VERACIDAD: todo ángulo — y en especial el elegido — tiene que poder señalarse \
palabra por palabra dentro del título/descripción o texto que te pasaron. Nunca inventes \
un hecho, motivo, institución o actor (policía, gobierno, familiar, etc.) que no esté \
mencionado ahí. Si el texto dice que hubo condena/confrontación/investigación activa, no \
inventes un ángulo de encubrimiento o caso cerrado — sería contradecir la fuente, no \
reinterpretarla. Si el texto no menciona a la policía o a ninguna institución, no \
construyas un ángulo que dependa de que exista una.

BRECHA DE CURIOSIDAD: la miniatura tiene que CREAR distancia entre lo que el espectador \
sabe y lo que quiere saber, nunca cerrarla. Si la miniatura ya responde la pregunta, no \
hay razón para hacer clic. Mostrar, no decir: un dato o una imagen de evidencia generan \
más brecha que una frase que afirma algo.

Con la idea de video que te pasan, generá en una sola respuesta, usando la tool \
generate_thumbnail_idea:

1. 5 ángulos candidatos (la tensión específica, no el tema; qué pregunta deja sin \
responder; por qué es más fuerte que describir el video literalmente o que apoyarse en \
el dato literal más fuerte si ya alcanza; y por qué es coherente con el título/descripción \
dados, sin inventar ni contradecir nada de ahí), marcando uno como recommended=true.
2. Si hay referencias (miniaturas/títulos de otros outliers del mismo nicho), analizá \
cada una: promesa principal, emoción que activa, elemento visual dominante, qué muestra, \
qué oculta a propósito, patrón que se repite. Si no hay referencias, referenceAnalysis \
debe ser null. Nunca copiés el patrón literal — aplicalo al ángulo elegido.
3. 10 títulos (máximo 60 caracteres, ideal menos de 50, ninguno con estructuras gastadas \
tipo "Cómo hacer X en Y pasos"), cada uno atacando el ángulo, no describiendo el tema, con \
una nota de qué miedo o deseo específico activa, rankeados de mayor a menor potencial de \
CTR (ctrRank 1 = mayor potencial) y marcando isTopThree=true en los 3 mejores.
4. Concepto de miniatura para el título elegido: elemento visual principal, expresión \
facial si corresponde (ver abajo), contraste de color (colores opuestos que peleen \
visualmente, no que combinen lindo), qué información oculta la miniatura a propósito, y \
la regla de complemento (miniatura y título dicen cosas DISTINTAS que se completan, nunca \
repiten la misma idea) — más 5 opciones de texto corto (3-5 palabras) que complementen el \
título sin repetirlo.
5. Un prompt de generación de imagen listo para pegar en un generador de imágenes \
(formato 16:9): composición, sujeto principal, fondo, iluminación, colores, emoción, \
estilo visual. Sin texto dentro de la imagen salvo que sea estrictamente necesario.

Sobre los presentadores: el campo requestedHostFeature del pedido indica si esta \
miniatura debe mostrar a un presentador, a ambos, o a ninguno. Si es NONE, \
facialExpression debe ser null y el prompt de imagen no debe describir una cara humana \
real. Si es HOST_1, HOST_2 o BOTH, facialExpression debe describir la expresión \
recomendada (sorpresa/incredulidad/miedo, primer plano, alta resolución) y el prompt de \
imagen debe indicar explícitamente que la composición está pensada para insertar la foto \
de referencia del/de los presentador(es) que el usuario va a adjuntar a mano en su \
generador de imágenes — no inventes rasgos faciales de una persona que no vas a ver.`;
}

function hostFeatureInstruction(pref: HostFeaturePreference): string {
  switch (pref) {
    case "NONE":
      return "No debe aparecer ningún presentador en esta miniatura.";
    case "HOST_1":
      return "Debe aparecer el presentador 1 (el usuario adjuntará su foto de referencia a mano en ChatGPT).";
    case "HOST_2":
      return "Debe aparecer el presentador 2 (el usuario adjuntará su foto de referencia a mano en ChatGPT).";
    case "BOTH":
      return "Deben aparecer ambos presentadores (el usuario adjuntará sus fotos de referencia a mano en ChatGPT).";
  }
}

export function buildThumbnailIdeaMessages(
  input: BuildPromptInput
): Anthropic.MessageParam[] {
  const parts: string[] = [];

  if (input.ideaSource.type === "outlier") {
    parts.push(`IDEA DE VIDEO (elegida de nuestro buscador de outliers):`);
    parts.push(`Título de referencia: ${input.ideaSource.title}`);
    if (input.ideaSource.description) {
      parts.push(`Descripción: ${input.ideaSource.description}`);
    }
  } else {
    parts.push(`IDEA DE VIDEO (escrita a mano):`);
    parts.push(input.ideaSource.text);
  }

  parts.push("");
  parts.push(`PRESENTADORES: ${hostFeatureInstruction(input.requestedHostFeature)}`);

  const content: Anthropic.ContentBlockParam[] = [];

  if (input.references.length === 0) {
    parts.push("");
    parts.push("No se proporcionaron referencias de otros outliers.");
  } else {
    parts.push("");
    parts.push(`REFERENCIAS (${input.references.length}) — analizalas en el paso 2:`);
    input.references.forEach((ref, i) => {
      parts.push(`Referencia ${i + 1} (outlierId=${ref.outlierId}): "${ref.title}"`);
      if (!ref.thumbnailUrl) {
        parts.push(`  (sin miniatura disponible, solo título)`);
      }
    });
  }

  content.push({ type: "text", text: parts.join("\n") });

  for (const ref of input.references) {
    if (ref.thumbnailUrl) {
      content.push({
        type: "image",
        source: { type: "url", url: ref.thumbnailUrl },
      });
    }
  }

  return [{ role: "user", content }];
}
