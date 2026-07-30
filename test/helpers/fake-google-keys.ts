import { base64UrlEncode } from "../../src/auth/jwt.ts";
import type { KeyResolver } from "../../src/auth/jwks.ts";

const encoder = new TextEncoder();

/**
 * A throwaway RSA keypair that stands in for Google's signing keys, so JWT
 * verification can be exercised with no network. Produces RS256 tokens and a
 * matching JWKS / KeyResolver.
 */
export interface FakeIssuer {
  kid: string;
  publicJwk: JsonWebKey & { kid: string; alg: string; use: string };
  jwks: { keys: (JsonWebKey & { kid: string })[] };
  resolver: KeyResolver;
  sign(payload: Record<string, unknown>): Promise<string>;
}

export async function createFakeIssuer(kid = "test-kid-1"): Promise<FakeIssuer> {
  const pair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;

  const rawPublic = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey;
  const publicJwk = { ...rawPublic, kid, alg: "RS256", use: "sig" };

  const sign = async (payload: Record<string, unknown>): Promise<string> => {
    const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT", kid })));
    const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
    const input = `${header}.${body}`;
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, encoder.encode(input));
    return `${input}.${base64UrlEncode(new Uint8Array(sig))}`;
  };

  const resolver: KeyResolver = async (requestedKid: string) =>
    requestedKid === kid ? publicJwk : null;

  return { kid, publicJwk, jwks: { keys: [publicJwk] }, resolver, sign };
}

/** Convenience: a valid Google ID-token payload with overridable claims. */
export function googleIdPayload(
  over: Partial<{
    email: string;
    email_verified: boolean;
    aud: string;
    nonce: string;
    iss: string;
    iat: number;
    exp: number;
    sub: string;
  }> = {},
): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: "https://accounts.google.com",
    aud: "test-client.apps.googleusercontent.com",
    sub: "1234567890",
    email: "abc@gmail.com",
    email_verified: true,
    iat: now,
    exp: now + 3600,
    ...over,
  };
}
