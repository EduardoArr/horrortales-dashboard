import { describe, expect, it } from "vitest";
import {
  computeChannelBaseline,
  computeVpd,
  findOutliers,
  type Video,
} from "./outliers";

const NOW = new Date("2026-07-01T00:00:00Z");

function makeVideo(
  videoId: string,
  views: number,
  daysAgo: number,
  durationSeconds = 600
): Video {
  return {
    videoId,
    title: `Video ${videoId}`,
    description: "",
    channelAlias: "Canal Test",
    url: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: null,
    views,
    publishedAt: new Date(NOW.getTime() - daysAgo * 86_400_000),
    durationSeconds,
  };
}

describe("computeVpd", () => {
  it("normalizes by days", () => {
    const video = makeVideo("v1", 10000, 10);
    expect(computeVpd(video, NOW)).toBe(1000);
  });

  it("floors the denominator at one day", () => {
    const video = makeVideo("v1", 2400, 0.25); // 6 hours ago
    expect(computeVpd(video, NOW)).toBe(2400);
  });
});

describe("computeChannelBaseline", () => {
  it("returns null when there are too few videos", () => {
    const videos = Array.from({ length: 3 }, (_, i) =>
      makeVideo(`v${i}`, 1000, 10)
    );
    expect(computeChannelBaseline(videos, NOW)).toBeNull();
  });

  it("uses the median, not the average", () => {
    const videos = Array.from({ length: 5 }, (_, i) =>
      makeVideo(`v${i}`, 1000, 10)
    );
    videos.push(makeVideo("viral", 1_000_000, 10));
    expect(computeChannelBaseline(videos, NOW)).toBe(100);
  });

  it("excludes the candidate video", () => {
    const videos = Array.from({ length: 5 }, (_, i) =>
      makeVideo(`v${i}`, 1000, 10)
    );
    videos.push(makeVideo("candidate", 999999, 10));
    expect(computeChannelBaseline(videos, NOW, "candidate")).toBe(100);
  });

  it("excludes videos published under 24h ago", () => {
    const videos = Array.from({ length: 5 }, (_, i) =>
      makeVideo(`v${i}`, 1000, 10)
    );
    videos.push(makeVideo("too_new", 1_000_000, 0.1));
    expect(computeChannelBaseline(videos, NOW)).toBe(100);
  });
});

describe("findOutliers", () => {
  it("filters by min score", () => {
    const videos = Array.from({ length: 5 }, (_, i) =>
      makeVideo(`v${i}`, 1000, 10)
    );
    videos.push(makeVideo("big", 250000, 10));
    videos.push(makeVideo("small", 1500, 10));
    const results = findOutliers(videos, 100000, NOW, 3.0, 0.0);
    const ids = results.map((r) => r.videoId);
    expect(ids).toContain("big");
    expect(ids).not.toContain("small");
  });

  it("filters by views vs subscribers", () => {
    const videos = Array.from({ length: 5 }, (_, i) =>
      makeVideo(`v${i}`, 1000, 10)
    );
    videos.push(makeVideo("big", 250000, 10));
    const results = findOutliers(videos, 10_000_000, NOW, 3.0, 0.1);
    expect(results).toEqual([]);
  });

  it("sorts by score descending", () => {
    const videos = Array.from({ length: 5 }, (_, i) =>
      makeVideo(`v${i}`, 1000, 10)
    );
    videos.push(makeVideo("mid", 50000, 10));
    videos.push(makeVideo("big", 250000, 10));
    const results = findOutliers(videos, 100000, NOW, 3.0, 0.0);
    const scores = results.map((r) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(results.map((r) => r.videoId)).toEqual(["big", "mid"]);
  });
});
