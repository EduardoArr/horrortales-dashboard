function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** A channel is "small or medium" if it has at most this many subscribers.
 *  Raised 50k → 100k → 500k: the channel's target style (viral, single-case
 *  commentary videos — "Caso King Von", "El Caso D4vd es muy TURBIO") skews
 *  toward medium-sized commentary/true-crime channels (100k-1M), not just
 *  tiny emerging ones. Still below the largest reference channels
 *  (@ThatChapter at 2.26M), so there's still real "outlier" upside instead
 *  of just re-surfacing what everyone already watches. */
export const MAX_SUBSCRIBERS = envInt("DISCOVERY_MAX_SUBSCRIBERS", 500_000);

/** Channels below this subscriber count are rejected — too small to be a
 *  meaningful signal (avoids one-video-fluke channels). */
export const MIN_SUBSCRIBERS = envInt("DISCOVERY_MIN_SUBSCRIBERS", 5_000);

/** A channel is "recent" if it was created within this many months. */
export const MAX_CHANNEL_AGE_MONTHS = envInt(
  "DISCOVERY_MAX_CHANNEL_AGE_MONTHS",
  24
);

/** Channels younger than this are rejected — too new to tell if growth is
 *  a real trend rather than a first-week spike. */
export const MIN_CHANNEL_AGE_MONTHS = envInt(
  "DISCOVERY_MIN_CHANNEL_AGE_MONTHS",
  5
);

/** Channels reporting a country outside this list are rejected. Channels
 *  with no country set are NOT rejected — see discoverChannels.ts. */
export const ALLOWED_COUNTRIES = (
  process.env.DISCOVERY_ALLOWED_COUNTRIES ?? "US,CA,GB,AU,IE,NZ"
)
  .split(",")
  .map((c) => c.trim().toUpperCase())
  .filter(Boolean);

/** Same threshold the ported scoring engine uses (lib/outliers.ts), kept
 *  here too so discovery can skip channels before doing any scoring work. */
export const MIN_LONG_FORM_VIDEOS = 5;

export const MIN_SCORE = envInt("DISCOVERY_MIN_SCORE", 3);
export const MIN_VIEWS_VS_SUBS = envInt("DISCOVERY_MIN_VIEWS_VS_SUBS", 0.1);

/** An outlier video must have at least this many views — filters out
 *  videos with a great ratio/score but too little absolute traction. */
export const MIN_VIDEO_VIEWS = envInt("DISCOVERY_MIN_VIDEO_VIEWS", 50_000);

/** Hard ceiling on YouTube Data API units spent per UTC day (free daily
 *  quota is 10,000). Leaves headroom below the hard limit. */
export const DAILY_QUOTA_CAP = envInt("DISCOVERY_DAILY_QUOTA_CAP", 8_000);

/** How many keywords a single discovery run searches via search.list
 *  (100 units each) before moving on to refreshing known channels. Lower
 *  than the Spanish pool's share (4 vs 8) — the channel's target content
 *  style is overwhelmingly Spanish-language. */
export const KEYWORDS_PER_RUN = envInt("DISCOVERY_KEYWORDS_PER_RUN", 4);

/** How many already-known channels get refreshed (re-scored) per run,
 *  oldest lastCheckedAt first. */
export const CHANNELS_TO_REFRESH_PER_RUN = envInt(
  "DISCOVERY_CHANNELS_PER_RUN",
  150
);

export const SEARCH_REGION_CODE = "US";
export const SEARCH_RELEVANCE_LANGUAGE = "en";
export const SEARCH_PUBLISHED_WITHIN_DAYS = 90;

/** Spanish-language discovery pass — runs in parallel with the English one
 *  (not a replacement), since the channel's own reference competitors
 *  (Api Youtube/config/channels.yaml) are largely Spanish-language. */
export const SEARCH_REGION_CODE_ES = process.env.DISCOVERY_SEARCH_REGION_ES ?? "MX";
export const SEARCH_RELEVANCE_LANGUAGE_ES = "es";

/** Countries accepted for the Spanish pass: Spain + the largest LatAm
 *  YouTube markets, plus US (many Latino creators register their channel
 *  there). Separate from ALLOWED_COUNTRIES (the English/US pass). */
export const ALLOWED_COUNTRIES_ES = (
  process.env.DISCOVERY_ALLOWED_COUNTRIES_ES ?? "ES,MX,AR,CO,CL,PE,VE,EC,US"
)
  .split(",")
  .map((c) => c.trim().toUpperCase())
  .filter(Boolean);

export const KEYWORDS_PER_RUN_ES = envInt("DISCOVERY_KEYWORDS_PER_RUN_ES", 8);

/** A keyword is eligible to be searched again once this many days have
 *  passed since it was last run, so the ~30-keyword pool cycles roughly
 *  every 5 days at KEYWORDS_PER_RUN=6/day. */
export const KEYWORD_COOLDOWN_DAYS = envInt("DISCOVERY_KEYWORD_COOLDOWN_DAYS", 5);
