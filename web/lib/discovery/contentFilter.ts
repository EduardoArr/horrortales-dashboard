/**
 * Best-effort filter to keep invented horror content (creepypasta, nosleep-
 * style fiction, animated horror) out of the outliers feed. The channel
 * covers real cases (true crime, disappearances, survival, paranormal
 * accounts), not made-up stories, and YouTube's API has no "is this real"
 * field — this is a title/description keyword heuristic, not a guarantee.
 */
const FICTION_MARKERS: RegExp[] = [
  /creepypasta/i,
  /\bno[\s-]?sleep\b/i,
  /fan[\s-]?fiction/i,
  /\bfictional story\b/i,
  /scary stories? to tell/i,
  /\b(animated|animation)\b.*\b(horror|scary)\b/i,
  /\bhorror\b.*\b(animation|animated)\b/i,
  /\boriginal horror story\b/i,
  /\bhorror fiction\b/i,
  /\bcreepy skit\b/i,
];

export function isLikelyFictional(title: string, description = ""): boolean {
  const text = `${title} ${description}`;
  return FICTION_MARKERS.some((marker) => marker.test(text));
}

/**
 * Best-effort filter to keep "top N" / listicle-style compilation videos out
 * of the outliers feed. The channel covers a single case per video, not
 * ranked lists — this is a title/description keyword heuristic (English +
 * Spanish), not a guarantee.
 */
const LISTICLE_MARKERS: RegExp[] = [
  /\btop\s*\d+\b/i,
  /\branking\b/i,
  /\branked\b/i,
  /^\s*(los|las)\s+\d+\b/i,
  /\bm[aá]s\s+(crueles|peligrosos|terribles|espeluznantes|perturbadores)\b/i,
  // General "leading count" signal: a title that opens with a 1-3 digit
  // number followed by a word almost always means a compilation ("22
  // DEADLY Women...", "9 WEIRD And BIZARRE People...", "5 PET ATTACKS...",
  // "18 Women EXECUTED..."), regardless of which adjective/noun follows.
  // Excludes 4+ digit numbers so years ("1996: The Zodiac Killer") aren't
  // caught, and excludes a leading "911" (the emergency number, not a
  // count — "911 call true crime" is one of our own search keywords).
  /^\s*(?!911(?:\D|$))\d{1,3}(?!\d)\s+\S/,
];

export function isLikelyListicle(title: string, description = ""): boolean {
  const text = `${title} ${description}`;
  return LISTICLE_MARKERS.some((marker) => marker.test(text));
}

/**
 * Best-effort filter for two off-topic genres that slip through channel-level
 * discovery: mass-produced scripted "drama short" channels (infidelity/revenge
 * soap-opera stories, tagged with a recognizable hashtag cluster) and sports
 * content. Both get discovered because a single loosely-matching video from
 * the channel surfaced for a generic keyword (e.g. "el caso de", "la verdad
 * sobre") — discovery only checks the channel's subs/age/country, not topic,
 * so every other recent upload from that channel becomes score-eligible too.
 * See lib/discovery/scoreChannels.ts, which applies this per-video alongside
 * isLikelyFictional/isLikelyListicle.
 */
const SCRIPTED_DRAMA_MARKERS: RegExp[] = [
  /#shortdramas?\b/i,
  /#dramashorts?\b/i,
  /#cenicienta\b/i,
  /#peliculacompleta\b/i,
  /#amorpropio\b/i,
  /#chicavaliente\b/i,
  /#millonariofr[ií]o\b/i,
  /#shortfilm\b[\s\S]*#drama\b/i,
];

const SPORTS_MARKERS: RegExp[] = [
  /\b(f[uú]tbol|soccer)\b/i,
  /\bmessi\b/i,
  /\b(champions league|la liga|liga mx)\b/i,
  /\bgol de\b/i,
  /\bresumen del partido\b/i,
];

export function isLikelyOffTopic(title: string, description = ""): boolean {
  const text = `${title} ${description}`;
  return (
    SCRIPTED_DRAMA_MARKERS.some((marker) => marker.test(text)) ||
    SPORTS_MARKERS.some((marker) => marker.test(text))
  );
}
