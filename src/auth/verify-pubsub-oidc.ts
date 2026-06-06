import { verifyRsaJwt, type KeyResolver } from "./jwks.ts";
import { unauthorized } from "../lib/errors.ts";

const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const CLOCK_SKEW = 60; // seconds

export interface VerifyPubSubOptions {
  resolve: KeyResolver;
  /** Expected `aud` configured on the push subscription. */
  audience: string;
  /** Expected `email` claim — the push subscription's service account. */
  serviceAccountEmail: string;
  now: number; // unix seconds
}

/**
 * Verify the OIDC JWT that Google Pub/Sub attaches (Authorization: Bearer) to an
 * authenticated push request. On success the request is genuinely from our push
 * subscription. Checks signature + iss + aud + service-account email + exp.
 */
export async function verifyPubSubPushToken(
  token: string,
  opts: VerifyPubSubOptions,
): Promise<Record<string, unknown>> {
  const payload = await verifyRsaJwt(token, opts.resolve);

  const iss = payload.iss;
  if (typeof iss !== "string" || !GOOGLE_ISSUERS.has(iss)) throw unauthorized("bad_issuer");

  if (payload.aud !== opts.audience) throw unauthorized("bad_audience");

  if (payload.email !== opts.serviceAccountEmail) throw unauthorized("bad_service_account");
  if (payload.email_verified !== true && payload.email_verified !== "true") {
    throw unauthorized("sa_email_not_verified");
  }

  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || exp + CLOCK_SKEW < opts.now) throw unauthorized("token_expired");

  return payload;
}
