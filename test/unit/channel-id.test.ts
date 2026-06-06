import { describe, it, expect } from "vitest";
import {
  buildCalendarChannelId,
  parseCalendarChannelId,
  randomNonce,
  MAX_CHANNEL_ID_LEN,
} from "../../src/routing/channel-id.ts";

const KEY = "lihoigfzisd3533cvaluhfd5zq"; // 26-char routing key from golden vectors

describe("calendar channel id", () => {
  it("round-trips routing key through build/parse", () => {
    const id = buildCalendarChannelId(KEY, "abcdefghij234567");
    expect(id).toBe(`cm.${KEY}.abcdefghij234567`);
    expect(parseCalendarChannelId(id)).toEqual({ routingKey: KEY, nonce: "abcdefghij234567" });
  });

  it("stays within Google's 64-char limit (with a generated nonce)", () => {
    const id = buildCalendarChannelId(KEY);
    expect(id.length).toBeLessThanOrEqual(MAX_CHANNEL_ID_LEN);
  });

  it("rejects foreign / malformed channel ids", () => {
    expect(parseCalendarChannelId("random-uuid-1234")).toBeNull();
    expect(parseCalendarChannelId(`cm.${KEY}`)).toBeNull(); // missing nonce
    expect(parseCalendarChannelId(`cm.tooshort.nonce`)).toBeNull();
    expect(parseCalendarChannelId(`xx.${KEY}.nonce`)).toBeNull(); // wrong prefix
    expect(parseCalendarChannelId(`cm.${KEY.toUpperCase()}.nonce`)).toBeNull(); // wrong case
  });

  it("randomNonce yields the requested length of base32 chars", () => {
    expect(randomNonce(16)).toMatch(/^[a-z2-7]{16}$/);
  });
});
