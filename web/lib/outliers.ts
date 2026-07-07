export interface Video {
  videoId: string;
  title: string;
  description: string;
  channelAlias: string;
  url: string;
  thumbnailUrl: string | null;
  views: number;
  publishedAt: Date;
  durationSeconds: number;
}

export interface OutlierResult {
  videoId: string;
  title: string;
  description: string;
  channel: string;
  url: string;
  thumbnailUrl: string | null;
  views: number;
  publishedAt: string;
  vpd: number;
  channelBaselineVpd: number;
  score: number;
  viewsVsSubs: number;
  subscriberCount: number;
}

/** Nothing under 10 minutes counts as long-form for this channel — shorts
 *  and quick recaps aren't the kind of narrated-case video we're after. */
export const MIN_LONG_FORM_SECONDS = 600;
export const MIN_VIDEOS_FOR_BASELINE = 5;
export const MIN_AGE_HOURS = 24;

export function computeVpd(video: Video, now: Date): number {
  const days = (now.getTime() - video.publishedAt.getTime()) / 86_400_000;
  return video.views / Math.max(days, 1);
}

export function isEligibleForAnalysis(video: Video, now: Date): boolean {
  const ageHours = (now.getTime() - video.publishedAt.getTime()) / 3_600_000;
  return ageHours >= MIN_AGE_HOURS;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function computeChannelBaseline(
  videos: Video[],
  now: Date,
  excludeVideoId?: string
): number | null {
  const eligible = videos.filter(
    (v) => isEligibleForAnalysis(v, now) && v.videoId !== excludeVideoId
  );
  if (eligible.length < MIN_VIDEOS_FOR_BASELINE) return null;
  return median(eligible.map((v) => computeVpd(v, now)));
}

export function findOutliers(
  videos: Video[],
  subscriberCount: number,
  now: Date,
  minScore: number,
  minViewsVsSubs: number,
  minViews = 0
): OutlierResult[] {
  const results: OutlierResult[] = [];

  for (const video of videos) {
    if (!isEligibleForAnalysis(video, now)) continue;
    if (video.views < minViews) continue;

    const baseline = computeChannelBaseline(videos, now, video.videoId);
    if (!baseline) continue;

    const vpd = computeVpd(video, now);
    const score = vpd / baseline;
    const viewsVsSubs = subscriberCount ? video.views / subscriberCount : 0;

    if (score >= minScore && viewsVsSubs >= minViewsVsSubs) {
      results.push({
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        channel: video.channelAlias,
        url: video.url,
        thumbnailUrl: video.thumbnailUrl,
        views: video.views,
        publishedAt: video.publishedAt.toISOString(),
        vpd,
        channelBaselineVpd: baseline,
        score,
        viewsVsSubs,
        subscriberCount,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
