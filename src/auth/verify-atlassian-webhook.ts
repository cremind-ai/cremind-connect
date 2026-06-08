import { verifyHs256 } from "./jwt.ts";

const CLOCK_SKEW = 60; // seconds

/**
 * Verify the bearer JWT Atlassian attaches (Authorization header) to a dynamic
 * webhook delivery registered by an OAuth 2.0 (3LO) app.
 *
 * Per Atlassian's webhook docs, deliveries to OAuth 2.0 apps are "secured by
 * bearer authentication … signed with the app's client secret" — i.e. a symmetric
 * (HS256) JWT keyed by the client secret. We verify the signature and expiry.
 *
 * Returns the payload on success, or null on any failure (bad signature, wrong
 * alg, expired). A failed verification means we reject the push; a forged push
 * could at most trigger a redundant, authorized resync on the client anyway.
 */
export async function verifyAtlassianWebhook(
  token: string,
  clientSecret: string,
  now: number,
): Promise<Record<string, unknown> | null> {
  const payload = await verifyHs256(token, clientSecret);
  if (!payload) return null;
  const exp = Number(payload.exp);
  if (Number.isFinite(exp) && exp + CLOCK_SKEW < now) return null;
  return payload;
}
