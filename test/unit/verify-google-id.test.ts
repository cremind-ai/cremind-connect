import { describe, it, expect, beforeAll } from "vitest";
import { verifyGoogleIdToken } from "../../src/auth/verify-google-id.ts";
import { createFakeIssuer, googleIdPayload, type FakeIssuer } from "../helpers/fake-google-keys.ts";

const CLIENT_ID = "test-client.apps.googleusercontent.com";
const NOW = Math.floor(Date.now() / 1000);

let issuer: FakeIssuer;
let other: FakeIssuer;
beforeAll(async () => {
  issuer = await createFakeIssuer("kid-a");
  other = await createFakeIssuer("kid-b");
});

async function verify(token: string) {
  return verifyGoogleIdToken(token, { resolve: issuer.resolver, clientId: CLIENT_ID, now: NOW });
}

describe("verifyGoogleIdToken", () => {
  it("accepts a valid token and returns claims", async () => {
    const token = await issuer.sign(googleIdPayload({ email: "abc@gmail.com", nonce: "n1" }));
    const claims = await verify(token);
    expect(claims.email).toBe("abc@gmail.com");
    expect(claims.nonce).toBe("n1");
  });

  it("rejects a wrong audience", async () => {
    const token = await issuer.sign(googleIdPayload({ aud: "someone-else" }));
    await expect(verify(token)).rejects.toMatchObject({ code: "bad_audience" });
  });

  it("rejects an expired token", async () => {
    const token = await issuer.sign(googleIdPayload({ exp: NOW - 3600 }));
    await expect(verify(token)).rejects.toMatchObject({ code: "token_expired" });
  });

  it("rejects an unverified email", async () => {
    const token = await issuer.sign(googleIdPayload({ email_verified: false }));
    await expect(verify(token)).rejects.toMatchObject({ code: "email_not_verified" });
  });

  it("rejects a bad issuer", async () => {
    const token = await issuer.sign(googleIdPayload({ iss: "https://evil.example.com" }));
    await expect(verify(token)).rejects.toMatchObject({ code: "bad_issuer" });
  });

  it("rejects a token signed by an unknown key (forged)", async () => {
    const token = await other.sign(googleIdPayload()); // signed with a key our resolver won't return
    await expect(verify(token)).rejects.toMatchObject({ code: "unknown_kid" });
  });
});
