import { describe, expect, it } from "vitest";
import { evaluateChannel, SPANISH_POOL } from "./discoverChannels";
import type { ChannelInfo } from "./youtubeClient";

const NOW = new Date("2026-07-03T00:00:00Z");

function makeChannel(overrides: Partial<ChannelInfo> = {}): ChannelInfo {
  return {
    channelId: "UCtest",
    title: "Test Channel",
    subscriberCount: 5_000,
    channelPublishedAt: new Date("2025-06-01T00:00:00Z"), // ~13 months old
    uploadsPlaylistId: "UUtest",
    country: "US",
    ...overrides,
  };
}

describe("evaluateChannel", () => {
  it("accepts a small, recent, US channel", () => {
    const result = evaluateChannel(makeChannel(), NOW);
    expect(result).toEqual({ accepted: true, isCountryVerified: true });
  });

  it("rejects a channel with too many subscribers", () => {
    const result = evaluateChannel(
      makeChannel({ subscriberCount: 5_000_000 }),
      NOW
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("SUBSCRIBER_COUNT_TOO_HIGH");
  });

  it("rejects a channel older than the age threshold", () => {
    const result = evaluateChannel(
      makeChannel({ channelPublishedAt: new Date("2015-01-01T00:00:00Z") }),
      NOW
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("CHANNEL_TOO_OLD");
  });

  it("rejects a channel whose country isn't allowed", () => {
    const result = evaluateChannel(makeChannel({ country: "ES" }), NOW);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("COUNTRY_NOT_ALLOWED");
  });

  it("accepts a channel with no country, but marks it unverified", () => {
    const result = evaluateChannel(makeChannel({ country: undefined }), NOW);
    expect(result).toEqual({ accepted: true, isCountryVerified: false });
  });

  it("rejects a Mexican channel under the English pool's allowed countries", () => {
    const result = evaluateChannel(makeChannel({ country: "MX" }), NOW);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("COUNTRY_NOT_ALLOWED");
  });

  it("accepts a Mexican channel under the Spanish pool's allowed countries", () => {
    const result = evaluateChannel(
      makeChannel({ country: "MX" }),
      NOW,
      SPANISH_POOL.allowedCountries
    );
    expect(result).toEqual({ accepted: true, isCountryVerified: true });
  });

  it("still rejects a US-disallowed country under the Spanish pool", () => {
    const result = evaluateChannel(
      makeChannel({ country: "FR" }),
      NOW,
      SPANISH_POOL.allowedCountries
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("COUNTRY_NOT_ALLOWED");
  });
});
