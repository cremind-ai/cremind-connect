import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";
import { createFakeIssuer, googleIdPayload, pubsubOidcPayload } from "../helpers/fake-google-keys.ts";
import { seedJwks } from "../helpers/seed-jwks.ts";
import { makePubSubPush } from "../helpers/make-pubsub-push.ts";
import { makeCalendarWebhook } from "../helpers/make-calendar-webhook.ts";
import { buildCalendarChannelId } from "../../src/routing/channel-id.ts";
import { openWs } from "../helpers/ws.ts";

const ABC_KEY = "lihoigfzisd3533cvaluhfd5zq"; // abc@gmail.com
const OTHER_KEY = "3zvcrrsjrgha7ls3pblmv4xjva"; // person@example.org
const ORIGIN = "https://connect.test";

const sub = (account: string, resources = "gmail,calendar") =>
  `${ORIGIN}/subscribe?account=${account}&resources=${resources}`;

describe("event fan-out (the shared-account requirement)", () => {
  it("delivers one gmail push to EVERY app linked to the same account", async () => {
    const issuer = await createFakeIssuer("kid-fan");
    await seedJwks(issuer);
    const now = Math.floor(Date.now() / 1000);
    const idA = await issuer.sign(googleIdPayload({ email: "abc@gmail.com", nonce: "A", exp: now + 3600 }));
    const idB = await issuer.sign(googleIdPayload({ email: "abc@gmail.com", nonce: "B", exp: now + 3600 }));

    const a = await openWs(sub(ABC_KEY), { authorization: `Bearer ${idA}` });
    const b = await openWs(sub(ABC_KEY), { authorization: `Bearer ${idB}` });

    expect(JSON.parse(await a.next())).toMatchObject({ type: "hello" });
    expect(JSON.parse(await b.next())).toMatchObject({ type: "hello" });

    const psToken = await issuer.sign(pubsubOidcPayload());
    const res = await SELF.fetch(makePubSubPush({ token: psToken, emailAddress: "abc@gmail.com", historyId: 42 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ delivered: 2 });

    expect(JSON.parse(await a.next())).toMatchObject({ type: "resync", source: "gmail" });
    expect(JSON.parse(await b.next())).toMatchObject({ type: "resync", source: "gmail" });

    a.close();
    b.close();
  });

  it("delivers a calendar webhook to the account hub", async () => {
    const issuer = await createFakeIssuer("kid-cal");
    await seedJwks(issuer);
    const id = await issuer.sign(googleIdPayload({ email: "abc@gmail.com", nonce: "C" }));

    const a = await openWs(sub(ABC_KEY, "calendar"), { authorization: `Bearer ${id}` });
    expect(JSON.parse(await a.next())).toMatchObject({ type: "hello" });

    const channelId = buildCalendarChannelId(ABC_KEY);
    const res = await SELF.fetch(makeCalendarWebhook({ channelId }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ delivered: 1 });

    expect(JSON.parse(await a.next())).toMatchObject({ type: "resync", source: "calendar" });
    a.close();
  });

  it("does NOT deliver across accounts", async () => {
    const issuer = await createFakeIssuer("kid-iso");
    await seedJwks(issuer);
    const idOther = await issuer.sign(googleIdPayload({ email: "person@example.org", nonce: "O" }));

    const other = await openWs(sub(OTHER_KEY), { authorization: `Bearer ${idOther}` });
    expect(JSON.parse(await other.next())).toMatchObject({ type: "hello" });

    const psToken = await issuer.sign(pubsubOidcPayload());
    const res = await SELF.fetch(makePubSubPush({ token: psToken, emailAddress: "abc@gmail.com" }));
    expect(await res.json()).toMatchObject({ delivered: 0 });

    await expect(other.next(400)).rejects.toThrow();
    other.close();
  });

  it("respects per-connection resource filtering", async () => {
    const issuer = await createFakeIssuer("kid-filter");
    await seedJwks(issuer);
    const id = await issuer.sign(googleIdPayload({ email: "abc@gmail.com", nonce: "F" }));

    // Subscribed to calendar only -> should ignore a gmail push.
    const a = await openWs(sub(ABC_KEY, "calendar"), { authorization: `Bearer ${id}` });
    expect(JSON.parse(await a.next())).toMatchObject({ type: "hello" });

    const psToken = await issuer.sign(pubsubOidcPayload());
    const res = await SELF.fetch(makePubSubPush({ token: psToken, emailAddress: "abc@gmail.com" }));
    expect(await res.json()).toMatchObject({ delivered: 0 });
    await expect(a.next(400)).rejects.toThrow();
    a.close();
  });
});

describe("subscribe auth", () => {
  it("rejects when the account does not match the id-token email", async () => {
    const issuer = await createFakeIssuer("kid-mismatch");
    await seedJwks(issuer);
    const id = await issuer.sign(googleIdPayload({ email: "abc@gmail.com", nonce: "M" }));
    await expect(openWs(sub(OTHER_KEY), { authorization: `Bearer ${id}` })).rejects.toThrow();
  });

  it("rejects when no credential is presented", async () => {
    await expect(openWs(sub(ABC_KEY))).rejects.toThrow();
  });

  it("rejects a replayed nonce", async () => {
    const issuer = await createFakeIssuer("kid-replay");
    await seedJwks(issuer);
    const id = await issuer.sign(googleIdPayload({ email: "abc@gmail.com", nonce: "DUP" }));

    const first = await openWs(sub(ABC_KEY), { authorization: `Bearer ${id}` });
    expect(JSON.parse(await first.next())).toMatchObject({ type: "hello" });
    // Same token (same nonce) reused -> replay rejected.
    await expect(openWs(sub(ABC_KEY), { authorization: `Bearer ${id}` })).rejects.toThrow();
    first.close();
  });
});
