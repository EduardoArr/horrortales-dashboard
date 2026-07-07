import { describe, expect, it } from "vitest";
import { mapVideoItem } from "./youtubeClient";

function makeItem(thumbnails?: {
  high?: { url?: string };
  medium?: { url?: string };
  default?: { url?: string };
}) {
  return {
    id: "v1",
    snippet: {
      title: "Some video",
      description: "Some description",
      publishedAt: "2026-05-01T00:00:00Z",
      channelId: "UC1",
      thumbnails,
    },
    statistics: { viewCount: "1000" },
    contentDetails: { duration: "PT11M0S" },
  };
}

describe("mapVideoItem thumbnail fallback", () => {
  it("prefers the high-res thumbnail", () => {
    const video = mapVideoItem(
      makeItem({
        high: { url: "high.jpg" },
        medium: { url: "medium.jpg" },
        default: { url: "default.jpg" },
      }),
      "Canal Test"
    );
    expect(video.thumbnailUrl).toBe("high.jpg");
  });

  it("falls back to medium when high is missing", () => {
    const video = mapVideoItem(
      makeItem({ medium: { url: "medium.jpg" }, default: { url: "default.jpg" } }),
      "Canal Test"
    );
    expect(video.thumbnailUrl).toBe("medium.jpg");
  });

  it("falls back to default when high and medium are missing", () => {
    const video = mapVideoItem(makeItem({ default: { url: "default.jpg" } }), "Canal Test");
    expect(video.thumbnailUrl).toBe("default.jpg");
  });

  it("returns null when no thumbnails are present", () => {
    const video = mapVideoItem(makeItem(undefined), "Canal Test");
    expect(video.thumbnailUrl).toBeNull();
  });
});
