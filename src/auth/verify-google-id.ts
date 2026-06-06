import { verifyRsaJwt, type KeyResolver } from "./jwks.ts";
import { unauthorized } from "../lib/errors.ts";

const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const CLOCK_SKEW = 60; // seconds

export interface GoogleIdTokenClaims {
  email: string;
  emailVerified: boolean;
  aud: string;
  nonce?: string;
  exp: number;
  iat: number;
  sub: string;
}

export interface VerifyGoogleIdOptions {
  resolve: KeyResolver;
  /** The org Desktop OAuth client id; must equal the token's `aud`. */
  clientId: string;
  now: number; // unix seconds
}

/**
 * Verify a Google OpenID Connect ID token and return its identity claims.
 *
 * This proves the holder controls the Google account named by `email`; it grants
 * NO API access (it is an identity assertion, not an access token). Replay
 * protection via the `nonce` claim is the caller's responsibility (a seen-nonce
 * store) since the nonce is client-chosen per link.
 */
export async function verifyGoogleIdToken(
  token: string,
  opts: VerifyGoogleIdOptions,
): Promise<GoogleIdTokenClaims> {
  const payload = await verifyRsaJwt(token, opts.resolve);

  const iss = payload.iss;
  if (typeof iss !== "string" || !GOOGLE_ISSUERS.has(iss)) throw unauthorized("bad_issuer");

  if (payload.aud !== opts.clientId) throw unauthorized("bad_audience");

  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || exp + CLOCK_SKEW < opts.now) throw unauthorized("token_expired");

  const iat = Number(payload.iat);
  if (Number.isFinite(iat) && iat - CLOCK_SKEW > opts.now) throw unauthorized("token_not_yet_valid");

  if (payload.email_verified !== true && payload.email_verified !== "true") {
    throw unauthorized("email_not_verified");
  }
  const email = payload.email;
  if (typeof email !== "string" || email.length === 0) throw unauthorized("missing_email");

  return {
    email,
    emailVerified: true,
    aud: opts.clientId,
    nonce: typeof payload.nonce === "string" ? payload.nonce : undefined,
    exp,
    iat: Number.isFinite(iat) ? iat : opts.now,
    sub: typeof payload.sub === "string" ? payload.sub : "",
  };
}
