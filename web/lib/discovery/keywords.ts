/**
 * Pool of English-language search keywords for the channel's real niches —
 * true crime, unresolved disappearances, extreme survival, paranormal
 * encounters (real accounts), FBI/cold cases, and similar — biased toward
 * the US market. Deliberately avoids fiction-leaning terms (creepypasta,
 * nosleep, scary storytime, urban legends) since the channel covers real
 * events, not invented horror stories. Rotated by runDiscovery.ts
 * (least-recently-searched first) rather than run all at once, to stay
 * within the YouTube Data API daily quota. Extend freely — no DB migration
 * needed to add or remove a keyword.
 */
export const DISCOVERY_KEYWORDS: string[] = [
  "true crime documentary",
  "true crime case breakdown",
  "real crime story",
  "unsolved murder case",
  "unsolved mystery case",
  "cold case files",
  "missing person case",
  "mysterious disappearance",
  "vanished without a trace",
  "FBI case files",
  "FBI most wanted case",
  "serial killer documentary",
  "serial killer psychology",
  "criminal mind case study",
  "young killer true crime",
  "teen killer case",
  "mass shooting documentary",
  "911 call true crime",
  "bodycam true crime",
  "crime scene investigation documentary",
  "extreme survival true story",
  "shipwreck survival story",
  "lost at sea survival story",
  "expedition disaster documentary",
  "internet mystery case",
  "unexplained internet mystery",
  "real paranormal encounter",
  "paranormal investigation case",
  "unexplained disappearance case",
  "cult documentary case",
  "kidnapping case true story",
  "conspiracy case documentary",
  "unsolved mystery case study",
  "murder case analysis",
  "criminal psychology case",
  "true crime deep dive",
  "the disappearance of",
  "the murder of",
  "criminal investigation case study",
  "cold case solved documentary",
];
