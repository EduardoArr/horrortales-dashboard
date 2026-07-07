import { prisma } from "../prisma";
import { getChannels, searchVideos, type ChannelInfo } from "./youtubeClient";
import { recordUnitsUsed, wouldExceedCap } from "./quota";
import { DISCOVERY_KEYWORDS } from "./keywords";
import { DISCOVERY_KEYWORDS_ES } from "./keywordsEs";
import {
  ALLOWED_COUNTRIES,
  ALLOWED_COUNTRIES_ES,
  KEYWORDS_PER_RUN,
  KEYWORDS_PER_RUN_ES,
  MAX_CHANNEL_AGE_MONTHS,
  MAX_SUBSCRIBERS,
  MIN_CHANNEL_AGE_MONTHS,
  MIN_SUBSCRIBERS,
  SEARCH_PUBLISHED_WITHIN_DAYS,
  SEARCH_REGION_CODE,
  SEARCH_REGION_CODE_ES,
  SEARCH_RELEVANCE_LANGUAGE,
  SEARCH_RELEVANCE_LANGUAGE_ES,
} from "./config";
import type { TriggerSource } from "@prisma/client";

/** A "pool" is one language/market pass over the keyword-search discovery
 *  pipeline. `runDiscovery.ts` runs the English and Spanish pools back to
 *  back within the same DiscoveryRun. */
export interface DiscoveryPool {
  keywords: string[];
  regionCode: string;
  relevanceLanguage: string;
  allowedCountries: string[];
  keywordsPerRun: number;
}

export const ENGLISH_POOL: DiscoveryPool = {
  keywords: DISCOVERY_KEYWORDS,
  regionCode: SEARCH_REGION_CODE,
  relevanceLanguage: SEARCH_RELEVANCE_LANGUAGE,
  allowedCountries: ALLOWED_COUNTRIES,
  keywordsPerRun: KEYWORDS_PER_RUN,
};

export const SPANISH_POOL: DiscoveryPool = {
  keywords: DISCOVERY_KEYWORDS_ES,
  regionCode: SEARCH_REGION_CODE_ES,
  relevanceLanguage: SEARCH_RELEVANCE_LANGUAGE_ES,
  allowedCountries: ALLOWED_COUNTRIES_ES,
  keywordsPerRun: KEYWORDS_PER_RUN_ES,
};

function utcDayStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Picks up to `limit` keywords from `keywords`, excluding ones already
 *  searched today (UTC), least-recently-searched first so the whole pool
 *  rotates. */
export async function pickKeywordsToRun(
  keywords: string[],
  limit: number
): Promise<string[]> {
  const todayStart = utcDayStart();
  const searchedToday = await prisma.keywordSearch.findMany({
    where: { executedAt: { gte: todayStart } },
    select: { keyword: true },
    distinct: ["keyword"],
  });
  const excludeToday = new Set(searchedToday.map((s) => s.keyword));

  const lastRuns = await prisma.keywordSearch.groupBy({
    by: ["keyword"],
    _max: { executedAt: true },
  });
  const lastRunAt = new Map(
    lastRuns.map((r) => [r.keyword, r._max.executedAt?.getTime() ?? 0])
  );

  return keywords
    .filter((k) => !excludeToday.has(k))
    .sort((a, b) => (lastRunAt.get(a) ?? 0) - (lastRunAt.get(b) ?? 0))
    .slice(0, limit);
}

export type RejectionReason =
  | "SUBSCRIBER_COUNT_TOO_HIGH"
  | "SUBSCRIBER_COUNT_TOO_LOW"
  | "CHANNEL_TOO_OLD"
  | "CHANNEL_TOO_NEW"
  | "COUNTRY_NOT_ALLOWED";

export function evaluateChannel(
  info: ChannelInfo,
  now = new Date(),
  allowedCountries: string[] = ALLOWED_COUNTRIES
): { accepted: boolean; reason?: RejectionReason; isCountryVerified: boolean } {
  if (info.subscriberCount > MAX_SUBSCRIBERS) {
    return { accepted: false, reason: "SUBSCRIBER_COUNT_TOO_HIGH", isCountryVerified: Boolean(info.country) };
  }

  if (info.subscriberCount < MIN_SUBSCRIBERS) {
    return { accepted: false, reason: "SUBSCRIBER_COUNT_TOO_LOW", isCountryVerified: Boolean(info.country) };
  }

  const ageMonths =
    (now.getTime() - info.channelPublishedAt.getTime()) / (30 * 86_400_000);
  if (ageMonths > MAX_CHANNEL_AGE_MONTHS) {
    return { accepted: false, reason: "CHANNEL_TOO_OLD", isCountryVerified: Boolean(info.country) };
  }

  if (ageMonths < MIN_CHANNEL_AGE_MONTHS) {
    return { accepted: false, reason: "CHANNEL_TOO_NEW", isCountryVerified: Boolean(info.country) };
  }

  if (info.country) {
    if (!allowedCountries.includes(info.country.toUpperCase())) {
      return { accepted: false, reason: "COUNTRY_NOT_ALLOWED", isCountryVerified: true };
    }
    return { accepted: true, isCountryVerified: true };
  }

  // No country on the channel — don't reject; the search was already
  // biased toward the pool's target market via regionCode/relevanceLanguage.
  return { accepted: true, isCountryVerified: false };
}

export interface DiscoverChannelsResult {
  keywordsRun: number;
  channelsDiscovered: number;
  channelsAccepted: number;
  quotaUnitsUsed: number;
  abortedOnQuota: boolean;
}

export async function discoverChannels(
  runId: string,
  trigger: TriggerSource,
  triggeredById: string | undefined,
  pool: DiscoveryPool = ENGLISH_POOL
): Promise<DiscoverChannelsResult> {
  const keywords = await pickKeywordsToRun(pool.keywords, pool.keywordsPerRun);
  const publishedAfter = new Date(
    Date.now() - SEARCH_PUBLISHED_WITHIN_DAYS * 86_400_000
  );

  let quotaUnitsUsed = 0;
  let channelsDiscovered = 0;
  let channelsAccepted = 0;
  let keywordsRun = 0;
  let abortedOnQuota = false;

  for (const keyword of keywords) {
    if (await wouldExceedCap(100)) {
      abortedOnQuota = true;
      break;
    }

    const { candidates, quotaCost } = await searchVideos({
      keyword,
      regionCode: pool.regionCode,
      relevanceLanguage: pool.relevanceLanguage,
      publishedAfter,
    });
    await recordUnitsUsed(quotaCost);
    quotaUnitsUsed += quotaCost;
    keywordsRun += 1;

    const keywordSearch = await prisma.keywordSearch.create({
      data: {
        keyword,
        regionCode: pool.regionCode,
        relevanceLanguage: pool.relevanceLanguage,
        resultCount: candidates.length,
        quotaCost,
        triggeredBy: trigger,
        triggeredById,
        runId,
      },
    });

    const candidateChannelIds = [...new Set(candidates.map((c) => c.channelId))];
    const known = await prisma.channel.findMany({
      where: { youtubeChannelId: { in: candidateChannelIds } },
      select: { youtubeChannelId: true },
    });
    const knownIds = new Set(known.map((c) => c.youtubeChannelId));
    const newChannelIds = candidateChannelIds.filter((id) => !knownIds.has(id));
    channelsDiscovered += newChannelIds.length;

    if (newChannelIds.length === 0) continue;

    const { channels, quotaCost: channelsQuotaCost } = await getChannels(newChannelIds);
    await recordUnitsUsed(channelsQuotaCost);
    quotaUnitsUsed += channelsQuotaCost;

    for (const info of channels) {
      const evaluation = evaluateChannel(info, new Date(), pool.allowedCountries);
      await prisma.channel.upsert({
        where: { youtubeChannelId: info.channelId },
        create: {
          youtubeChannelId: info.channelId,
          title: info.title,
          handle: info.handle,
          country: info.country,
          isCountryVerified: evaluation.isCountryVerified,
          subscriberCount: info.subscriberCount,
          channelPublishedAt: info.channelPublishedAt,
          uploadsPlaylistId: info.uploadsPlaylistId,
          thumbnailUrl: info.thumbnailUrl,
          source: "SEARCH_DISCOVERY",
          status: evaluation.accepted ? "CANDIDATE" : "REJECTED",
          rejectionReason: evaluation.reason,
          discoveredViaKeywordId: keywordSearch.id,
        },
        update: {
          subscriberCount: info.subscriberCount,
          country: info.country,
          isCountryVerified: evaluation.isCountryVerified,
        },
      });
      if (evaluation.accepted) channelsAccepted += 1;
    }
  }

  return { keywordsRun, channelsDiscovered, channelsAccepted, quotaUnitsUsed, abortedOnQuota };
}
