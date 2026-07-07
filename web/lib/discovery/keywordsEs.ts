/**
 * Pool de keywords de búsqueda en español para los mismos nichos reales del
 * canal — true crime, desapariciones sin resolver, supervivencia extrema,
 * encuentros paranormales reales, casos de secta, casos federales — sesgado
 * a caso único (no listas/compilaciones). Evita deliberadamente términos de
 * ficción (creepypasta, historias de terror inventadas). Se rota igual que
 * DISCOVERY_KEYWORDS (menos buscado recientemente primero) desde
 * runDiscovery.ts. Extender libremente — no requiere migración de DB.
 *
 * La segunda mitad de la lista es deliberadamente más casual/viral que la
 * primera (tono "documental") — el estilo real que busca el canal es más
 * cercano a comentario de YouTuber ("Caso King Von", "Esta TIKTOKER Debe
 * Estar en PRISIÓN") que a documental institucional.
 */
export const DISCOVERY_KEYWORDS_ES: string[] = [
  "documental de crimen real",
  "caso de asesinato sin resolver",
  "desaparición sin resolver",
  "expediente criminal caso real",
  "caso de crimen real analizado",
  "misterio sin resolver caso real",
  "secuestro caso real",
  "sobreviviente cuenta su historia",
  "historia real de supervivencia extrema",
  "naufragio historia real",
  "encuentro paranormal real",
  "investigación paranormal caso real",
  "secta documental caso real",
  "asesino en serie documental",
  "psicología criminal caso real",
  "la desaparición de",
  "el asesinato de",
  "caso criminal sin resolver",
  "el caso de",
  "el turbio caso de",
  "la verdad sobre el caso",
  "fue arrestado por",
  "está en la cárcel por",
  "la doble vida de",
  "escándalo de youtuber caso real",
  "transmitido en vivo caso real",
  "torturado hasta la muerte caso real",
  "rescate real historia verdadera",
  "por qué nunca debes meterte con",
];
