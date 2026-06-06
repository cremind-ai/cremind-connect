import { describe, it, expect } from "vitest";
import { mintRelaySession, verifyRelaySession } from "../../src/auth/relay-session.ts";

const KEY = "lihoigfzisd3533cvaluhfd5zq";
const SIGNING = "current-key";
const PREV = "previous-key";

describe("relay-session JWT", () => {
  it("mints and verifies a valid session", async () => {
    const now = 1_000_000;
    const { token, exp } = await mintRelaySession({ routingKey: KEY, ttlSeconds: 3600, signingKey: SIGNING, now });
    const s = await verifyRelaySession(token, { keys: [SIGNING], now: now + 10 });
    expect(s).toEqual({ routingKey: KEY, exp });
  });

  it("rejects an expired session", async () => {
    const now = 1_000_000;
    const { token } = await mintRelaySession({ routingKey: KEY, ttlSeconds: 60, signingKey: SIGNING, now });
    expect(await verifyRelaySession(token, { keys: [SIGNING], now: now + 120 })).toBeNull();
  });

  it("rejects a session signed with an unknown key", async () => {
    const now = 1_000_000;
    const { token } = await mintRelaySession({ routingKey: KEY, ttlSeconds: 3600, signingKey: "attacker", now });
    expect(await verifyRelaySession(token, { keys: [SIGNING, PREV], now })).toBeNull();
  });

  it("accepts a session signed with the previous key during rotation", async () => {
    const now = 1_000_000;
    const { token } = await mintRelaySession({ routingKey: KEY, ttlSeconds: 3600, signingKey: PREV, now });
    const s = await verifyRelaySession(token, { keys: [SIGNING, PREV], now });
    expect(s?.routingKey).toBe(KEY);
  });
});
