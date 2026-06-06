import { describe, it, expect, beforeAll } from "vitest";
import { verifyPubSubPushToken } from "../../src/auth/verify-pubsub-oidc.ts";
import { createFakeIssuer, pubsubOidcPayload, type FakeIssuer } from "../helpers/fake-google-keys.ts";

const AUDIENCE = "https://connect.test/ingress/google/pubsub";
const SA_EMAIL = "push@test.iam.gserviceaccount.com";
const NOW = Math.floor(Date.now() / 1000);

let issuer: FakeIssuer;
beforeAll(async () => {
  issuer = await createFakeIssuer("kid-ps");
});

async function verify(token: string) {
  return verifyPubSubPushToken(token, {
    resolve: issuer.resolver,
    audience: AUDIENCE,
    serviceAccountEmail: SA_EMAIL,
    now: NOW,
  });
}

describe("verifyPubSubPushToken", () => {
  it("accepts a valid push token", async () => {
    const token = await issuer.sign(pubsubOidcPayload());
    await expect(verify(token)).resolves.toMatchObject({ email: SA_EMAIL });
  });

  it("rejects a wrong audience", async () => {
    const token = await issuer.sign(pubsubOidcPayload({ aud: "https://evil/" }));
    await expect(verify(token)).rejects.toMatchObject({ code: "bad_audience" });
  });

  it("rejects a wrong service-account email", async () => {
    const token = await issuer.sign(pubsubOidcPayload({ email: "attacker@evil.iam.gserviceaccount.com" }));
    await expect(verify(token)).rejects.toMatchObject({ code: "bad_service_account" });
  });

  it("rejects an expired token", async () => {
    const token = await issuer.sign(pubsubOidcPayload({ exp: NOW - 100 }));
    await expect(verify(token)).rejects.toMatchObject({ code: "token_expired" });
  });

  it("rejects a bad issuer", async () => {
    const token = await issuer.sign(pubsubOidcPayload({ iss: "https://evil/" }));
    await expect(verify(token)).rejects.toMatchObject({ code: "bad_issuer" });
  });
});
