import { prisma } from "../prisma";
import { findOutliers, MIN_LONG_FORM_SECONDS } from "../outliers";
import { fetchRecentVideoIds, fetchVideoDetails } from "./youtubeClient";
import { wouldExceedCap, recordUnitsUsed } from "./quota";
import { isLikelyFictional, isLikelyListicle, isLikelyOffTopic } from "./contentFilter";
import {
  CHANNELS_TO_REFRESH_PER_RUN,
  MIN_CHANNEL_AGE_MONTHS,
  MIN_LONG_FORM_VIDEOS,
  MIN_SCORE,
  MIN_SUBSCRIBERS,
  MIN_VIDEO_VIEWS,
  MIN_VIEWS_VS_SUBS,
} from "./config";

export interface ScoreChannelsResult {
  channelsChecked: number;
  channelsSkippedTooFewVideos: number;
  outliersFound: number;
  quotaUnitsUsed: number;
  abortedOnQuota: boolean;
}

export async function scoreChannels(
  limit = CHANNELS_TO_REFRESH_PER_RUN
): Promise<ScoreChannelsResult> {
  const channels = await prisma.channel.findMany({
    // MANUAL_SEED channels are your known competitors (imported from the
    // legacy channels.yaml for reference) — scoring them would waste quota
    // and mix "already being done in Spain" videos into the outliers feed,
    // which is meant to surface ideas not yet exploited there. Only score
    // channels found by the automated small/recent/US discovery.
    where: { status: "CANDIDATE", source: "SEARCH_DISCOVERY" },
    orderBy: [{ lastCheckedAt: { sort: "asc", nulls: "first" } }],
    take: limit,
  });

  let channelsChecked = 0;
  let channelsSkippedTooFewVideos = 0;
  let outliersFound = 0;
  let quotaUnitsUsed = 0;
  let abortedOnQuota = false;

  for (const channel of channels) {
    if (await wouldExceedCap(2)) {
      abortedOnQuota = true;
      break;
    }

    const ageMonths =
      (Date.now() - channel.channelPublishedAt.getTime()) / (30 * 86_400_000);
    if (channel.subscriberCount < MIN_SUBSCRIBERS || ageMonths < MIN_CHANNEL_AGE_MONTHS) {
      await prisma.channel.update({
        where: { id: channel.id },
        data: { lastCheckedAt: new Date() },
      });
      continue;
    }

    const { videoIds, quotaCost: playlistQuotaCost } = await fetchRecentVideoIds(
      channel.uploadsPlaylistId
    );
    await recordUnitsUsed(playlistQuotaCost);
    quotaUnitsUsed += playlistQuotaCost;

    const { videos, quotaCost: videosQuotaCost } = await fetchVideoDetails(
      videoIds,
      channel.title
    );
    await recordUnitsUsed(videosQuotaCost);
    quotaUnitsUsed += videosQuotaCost;

    channelsChecked += 1;

    const longForm = videos.filter(
      (v) =>
        v.durationSeconds >= MIN_LONG_FORM_SECONDS &&
        !isLikelyFictional(v.title, v.description) &&
        !isLikelyListicle(v.title, v.description) &&
        !isLikelyOffTopic(v.title, v.description)
    );
    if (longForm.length < MIN_LONG_FORM_VIDEOS) {
      channelsSkippedTooFewVideos += 1;
      await prisma.channel.update({
        where: { id: channel.id },
        data: { lastCheckedAt: new Date() },
      });
      continue;
    }

    const results = findOutliers(
      longForm,
      channel.subscriberCount,
      new Date(),
      MIN_SCORE,
      MIN_VIEWS_VS_SUBS,
      MIN_VIDEO_VIEWS
    );

    for (const result of results) {
      await prisma.outlier.upsert({
        where: { youtubeVideoId: result.videoId },
        create: {
          youtubeVideoId: result.videoId,
          channelId: channel.id,
          title: result.title,
          description: result.description,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          views: result.views,
          publishedAt: new Date(result.publishedAt),
          durationSeconds:
            longForm.find((v) => v.videoId === result.videoId)?.durationSeconds ?? 0,
          vpd: result.vpd,
          channelBaselineVpd: result.channelBaselineVpd,
          score: result.score,
          viewsVsSubs: result.viewsVsSubs,
          subscriberCountAtCapture: result.subscriberCount,
        },
        update: {
          description: result.description,
          thumbnailUrl: result.thumbnailUrl,
          views: result.views,
          vpd: result.vpd,
          channelBaselineVpd: result.channelBaselineVpd,
          score: result.score,
          viewsVsSubs: result.viewsVsSubs,
          subscriberCountAtCapture: result.subscriberCount,
          lastRefreshedAt: new Date(),
        },
      });
      outliersFound += 1;
    }

    await prisma.channel.update({
      where: { id: channel.id },
      data: { lastCheckedAt: new Date() },
    });
  }

  return {
    channelsChecked,
    channelsSkippedTooFewVideos,
    outliersFound,
    quotaUnitsUsed,
    abortedOnQuota,
  };
}
