# Generador de títulos y miniaturas — Design

## Contexto

Con el buscador de outliers ya funcionando (fase 1), toca la siguiente sección de la web:
`/titulos-miniaturas`, hoy un placeholder `<ComingSoon />`. El objetivo: tomar una idea de vídeo
ya elegida (normalmente un `Outlier` marcado `SAVED`/`USED`, a veces una idea escrita a mano) y
generar automáticamente un ángulo, título, concepto de miniatura y un prompt de imagen listo para
pegar — adaptando el skill de Claude Code que el usuario ya usa a mano hoy (`encontrar-ideas-video`
/ el skill de packaging pegado en la sesión), pero especializado para su canal: dos presentadores
reales que **a veces** salen en la miniatura (no siempre, a diferencia de un canal faceless), con
opción de referenciar miniaturas/títulos de outliers ya descubiertos por la fase 1 como
inspiración.

## Decisiones cerradas con el usuario (brainstorming en sesión, 2026-07-04)

1. **Generación de imagen: manual.** La herramienta solo entrega el prompt de imagen (paso 5 del
   skill original) para pegar en el ChatGPT Premium que el usuario ya paga. Nada de llamar a una
   API de imágenes automáticamente — se evaluó (API de imágenes de OpenAI, gpt-image-1) pero se
   descartó por coste/complejidad extra que el usuario no pidió.
2. **Generación de texto (ángulo/títulos/concepto/prompt): automática, vía API de pago.** El
   usuario preguntó explícitamente por qué esto no podía hacerlo Claude "gratis" como en el chat —
   se le aclaró la diferencia entre una suscripción de chat (Claude Code / ChatGPT Premium) y una
   API key de servidor (console.anthropic.com), facturación por uso, aparte. Confirmó seguir
   adelante tras aclarar que el coste real es de ~1-2 $/mes con su volumen esperado.
   Motor elegido: **API de Anthropic** (no la suscripción de Claude Code) — necesaria porque el
   paso de "ingeniería inversa de referencias" requiere visión (analizar la imagen de la miniatura
   de referencia, no solo su título).
3. **Referencias de otros outliers: desde nuestra propia tabla `Outlier`**, buscadas y elegidas a
   mano por el usuario (buscador de texto simple, sin matching automático por tema/keyword).
4. **Fotos de los presentadores: se suben una vez y se reutilizan**, guardadas en Vercel Blob. El
   proyecto todavía no está enlazado a Vercel (`vercel link` nunca se corrió) — hace falta ese
   paso antes de poder crear el Blob store.
5. Coste es sensible para este usuario (ya rechazó pagar vidIQ en la fase 1) — diseño
   deliberadamente ligero: un solo modelo/proveedor de IA, sin cola de trabajos, sin generación de
   imagen automática, sin abstracción multi-proveedor.

## Prerrequisito descubierto durante el diseño

`Outlier.thumbnailUrl` existe en el schema desde la fase 1 pero nunca se rellena: ni
`lib/discovery/youtubeClient.ts` pide `snippet.thumbnails` en `videos.list`, ni
`lib/discovery/scoreChannels.ts` lo guarda en el upsert (a diferencia de `Channel.thumbnailUrl`,
que sí se mapea). Sin esto no hay imagen real que analizar como referencia — se corrige como parte
de esta fase, mismo patrón que se usó para añadir `Outlier.description` (ver
`web/docs/superpowers/plans/2026-07-04-titulos-miniaturas.md` para el detalle).

## Modelo de datos

Dos modelos nuevos en `prisma/schema.prisma`: `HostPhoto` (biblioteca de fotos de los dos
presentadores, subidas una vez a Vercel Blob y reutilizadas) y `ThumbnailIdea` (una generación:
idea de origen — `Outlier` o texto libre —, hasta 3 outliers de referencia elegidos a mano,
preferencia de qué presentador aparece, y la salida estructurada del LLM: 5 ángulos candidatos,
ángulo elegido, análisis de cada referencia si las hay, 10 títulos rankeados, título elegido,
concepto de miniatura, prompt de imagen). Detalle completo del schema en el plan de
implementación.

## Integración con la API de Anthropic

Un solo módulo (`lib/thumbnails/`) siguiendo el mismo patrón que
`lib/discovery/youtubeClient.ts`: construcción de prompt pura (testeable sin red), parseo de
respuesta puro (testeable sin red), y un cliente impuro con modo mock (`ANTHROPIC_MOCK=true`,
mismo convenio que `YOUTUBE_MOCK`). Salida estructurada vía tool-use forzado con `strict: true`
(no JSON libre parseado a mano). Las imágenes de referencia se pasan como bloques de imagen con
`source: {type: "url", url: outlier.thumbnailUrl}` — la API de Anthropic soporta traer la imagen
directamente desde la URL pública del CDN de YouTube, sin necesidad de descargarla y codificarla
en base64 nosotros mismos.

El "test de 5 personas" (paso 6 del skill original) no se genera por IA — es texto fijo en la UI,
mostrado siempre como recordatorio antes de marcar una idea como definitiva.

## Fuera de alcance de esta fase

- Generación automática de imagen (queda para más adelante si el usuario lo pide explícitamente).
- Matching automático de referencias por similitud de tema (el usuario las busca y elige a mano).
- Edición de vídeo (siempre fue explícitamente pospuesta desde el brainstorming original de la
  fase 1).
