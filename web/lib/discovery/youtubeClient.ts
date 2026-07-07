import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDurationSeconds } from "../durations";
import type { Video } from "../outliers";

const API_BASE = "https://www.googleapis.com/youtube/v3";
// Resolved from the working directory (project root under `next`, `vitest`,
// and `tsx`) rather than `__dirname`, which isn't reliable across the mixed
// ESM/CJS module systems those runners use.
const FIXTURES_DIR = join(process.cwd(), "lib/discovery/__fixtures__");

function isMock(): boolean {
  return process.env.YOUTUBE_MOCK === "true";
}

function loadFixture<T>(name: string): T {
  const raw = readFileSync(join(FIXTURES_DIR, `${name}.json`), "utf-8");
  return JSON.parse(raw) as T;
}

function apiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  return key;
}

async function callApi<T>(
  path: string,
  params: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(`${API_BASE}/${path}`);
  url.searchParams.set("key", apiKey());
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new YouTubeApiError(res.status, body);
  }
  return (await res.json()) as T;
}

export class YouTubeApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string
  ) {
    super(`YouTube API error ${status}: ${body.slice(0, 500)}`);
    this.name = "YouTubeApiError";
  }
}

export interface SearchCandidate {
  videoId: string;
  channelId: string;
}

interface SearchListResponse {
  items: { id: { videoId?: string }; snippet: { channelId: string } }[];
}

export interface SearchVideosParams {
  keyword: string;
  regionCode: string;
  relevanceLanguage: string;
  publishedAfter: Date;
  maxResults?: number;
  order?: "relevance" | "date";
}

/** search.list — 100 quota units per call. */
export async function searchVideos(
  params: SearchVideosParams
): Promise<{ candidates: SearchCandidate[]; quotaCost: number }> {
  const data = isMock()
    ? loadFixture<SearchListResponse>("search")
    : await callApi<SearchListResponse>("search", {
        part: "snippet",
        q: params.keyword,
        type: "video",
        regionCode: params.regionCode,
        relevanceLanguage: params.relevanceLanguage,
        // No videoDuration filter here: "medium" (4-20min) would exclude
        // longer documentary-style true-crime videos. The real >=10min
        // enforcement happens per-channel in scoreChannels.ts once we have
        // exact durations from videos.list.
        publishedAfter: params.publishedAfter.toISOString(),
        maxResults: params.maxResults ?? 50,
        order: params.order ?? "relevance",
      });

  const candidates = data.items
    .filter((item) => item.id.videoId)
    .map((item) => ({
      videoId: item.id.videoId as string,
      channelId: item.snippet.channelId,
    }));

  return { candidates, quotaCost: 100 };
}

export interface ChannelInfo {
  channelId: string;
  title: string;
  handle?: string;
  country?: string;
  subscriberCount: number;
  channelPublishedAt: Date;
  uploadsPlaylistId: string;
  thumbnailUrl?: string;
}

interface ChannelsListResponse {
  items: {
    id: string;
    snippet: {
      title: string;
      customUrl?: string;
      country?: string;
      publishedAt: string;
      thumbnails?: { default?: { url?: string } };
    };
    statistics: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
    contentDetails: { relatedPlaylists: { uploads: string } };
  }[];
}

function mapChannelItem(item: ChannelsListResponse["items"][number]): ChannelInfo {
  return {
    channelId: item.id,
    title: item.snippet.title,
    handle: item.snippet.customUrl,
    country: item.snippet.country,
    subscriberCount: item.statistics.hiddenSubscriberCount
      ? 0
      : Number(item.statistics.subscriberCount ?? 0),
    channelPublishedAt: new Date(item.snippet.publishedAt),
    uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
    thumbnailUrl: item.snippet.thumbnails?.default?.url,
  };
}

/** channels.list — 1 quota unit per call, up to 50 IDs per batch. */
export async function getChannels(
  channelIds: string[]
): Promise<{ channels: ChannelInfo[]; quotaCost: number }> {
  const channels: ChannelInfo[] = [];
  let quotaCost = 0;

  for (let i = 0; i < channelIds.length; i += 50) {
    const batch = channelIds.slice(i, i + 50);
    if (batch.length === 0) continue;

    const data = isMock()
      ? loadFixture<ChannelsListResponse>("channels")
      : await callApi<ChannelsListResponse>("channels", {
          part: "snippet,statistics,contentDetails",
          id: batch.join(","),
        });
    quotaCost += 1;

    for (const item of data.items) {
      channels.push(mapChannelItem(item));
    }
  }

  return { channels, quotaCost };
}

export class ChannelNotFoundError extends Error {
  constructor(public readonly channelRef: string) {
    super(`Channel not found: ${channelRef}`);
    this.name = "ChannelNotFoundError";
  }
}

/** Resolves a single channel by handle (e.g. "@MrBallen") or channel ID
 *  (e.g. "UC...") — used by the seed script to import config/channels.yaml.
 *  channels.list — 1 quota unit per call. */
export async function resolveChannel(channelRef: string): Promise<ChannelInfo> {
  const params = channelRef.startsWith("UC")
    ? { part: "snippet,statistics,contentDetails", id: channelRef }
    : {
        part: "snippet,statistics,contentDetails",
        forHandle: channelRef.startsWith("@") ? channelRef : `@${channelRef}`,
      };

  const data = isMock()
    ? loadFixture<ChannelsListResponse>("channels")
    : await callApi<ChannelsListResponse>("channels", params);

  const item = data.items[0];
  if (!item) throw new ChannelNotFoundError(channelRef);
  return mapChannelItem(item);
}

interface PlaylistItemsResponse {
  items: { contentDetails: { videoId: string } }[];
  nextPageToken?: string;
}

/** playlistItems.list — 1 quota unit per page. */
export async function fetchRecentVideoIds(
  uploadsPlaylistId: string,
  maxResults = 50
): Promise<{ videoIds: string[]; quotaCost: number }> {
  const data = isMock()
    ? loadFixture<PlaylistItemsResponse>("playlistItems")
    : await callApi<PlaylistItemsResponse>("playlistItems", {
        part: "contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults,
      });

  return {
    videoIds: data.items.map((item) => item.contentDetails.videoId),
    quotaCost: 1,
  };
}

interface VideosListResponse {
  items: {
    id: string;
    snippet: {
      title: string;
      description?: string;
      publishedAt: string;
      channelId: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
    statistics: { viewCount?: string };
    contentDetails: { duration: string };
  }[];
}

export function mapVideoItem(
  item: VideosListResponse["items"][number],
  channelAlias: string
): Video {
  return {
    videoId: item.id,
    title: item.snippet.title,
    description: (item.snippet.description ?? "").slice(0, 500),
    channelAlias,
    url: `https://www.youtube.com/watch?v=${item.id}`,
    thumbnailUrl:
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.medium?.url ??
      item.snippet.thumbnails?.default?.url ??
      null,
    views: Number(item.statistics.viewCount ?? 0),
    publishedAt: new Date(item.snippet.publishedAt),
    durationSeconds: parseDurationSeconds(item.contentDetails.duration),
  };
}

/** videos.list — 1 quota unit per batch of up to 50 IDs. */
export async function fetchVideoDetails(
  videoIds: string[],
  channelAlias: string
): Promise<{ videos: Video[]; quotaCost: number }> {
  const videos: Video[] = [];
  let quotaCost = 0;

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    if (batch.length === 0) continue;

    const data = isMock()
      ? loadFixture<VideosListResponse>("videos")
      : await callApi<VideosListResponse>("videos", {
          part: "snippet,contentDetails,statistics",
          id: batch.join(","),
        });
    quotaCost += 1;

    for (const item of data.items) {
      videos.push(mapVideoItem(item, channelAlias));
    }
  }

  return { videos, quotaCost };
}
