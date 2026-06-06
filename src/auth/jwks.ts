import type { Env } from "../env.ts";
import { decodeJwt, verifyRs256 } from "./jwt.ts";
import { unauthorized } from "../lib/errors.ts";
import { log } from "../lib/log.ts";

/**
 * Resolves a signing key by `kid`. Production uses {@link googleKeyResolver}
 * (KV-cached JWKS fetch); tests inject a fake resolver so signature verification
 * is exercised with no network.
 */
export type KeyResolver = (kid: string) => Promise<JsonWebKey | null>;

export const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const KV_KEY = "google_certs";
const DEFAULT_TTL_SECONDS = 3600;
const MIN_TTL_SECONDS = 60;

interface CachedCerts {
  keys: (JsonWebKey & { kid?: string })[];
  expiresAt: number; // unix seconds
}

function parseMaxAge(cacheControl: string | null): number {
  if (!cacheControl) return DEFAULT_TTL_SECONDS;
  const m = /max-age=(\d+)/i.exec(cacheControl);
  return m ? Number.parseInt(m[1]!, 10) : DEFAULT_TTL_SECONDS;
}

async function fetchCerts(): Promise<CachedCerts> {
  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) throw new Error(`jwks fetch failed: ${res.status}`);
  const ttl = Math.max(MIN_TTL_SECONDS, parseMaxAge(res.headers.get("cache-control")));
  const body = (await res.json()) as { keys: (JsonWebKey & { kid?: string })[] };
  return { keys: body.keys ?? [], expiresAt: Math.floor(Date.now() / 1000) + ttl };
}

/**
 * Google rotates keys infrequently. We cache the JWKS in KV (NOT Durable Object
 * memory, which hibernation clears). On a `kid` miss against a cached set we force
 * one refresh+retry to ride through a mid-cache rotation.
 */
export function googleKeyResolver(env: Env): KeyResolver {
  return async (kid: string): Promise<JsonWebKey | null> => {
    const now = Math.floor(Date.now() / 1000);
    const cached = (await env.JWKS_CACHE.get(KV_KEY, "json")) as CachedCerts | null;

    if (cached && cached.expiresAt > now) {
      const hit = cached.keys.find((k) => k.kid === kid);
      if (hit) {
        log.info("jwks", { event: "jwks", cacheHit: true });
        return hit;
      }
    }

    // Cache miss, expired, or unknown kid -> refresh.
    const fresh = await fetchCerts();
    const ttl = Math.max(MIN_TTL_SECONDS, fresh.expiresAt - now);
    await env.JWKS_CACHE.put(KV_KEY, JSON.stringify(fresh), { expirationTtl: ttl });
    log.info("jwks", { event: "jwks", cacheHit: false });
    return fresh.keys.find((k) => k.kid === kid) ?? null;
  };
}

/**
 * Verify an RS256 JWT's signature against a resolver and return its claims.
 * Performs NO claim validation beyond signature + alg; callers must check
 * iss/aud/exp/etc.
 */
export async function verifyRsaJwt(
  token: string,
  resolve: KeyResolver,
): Promise<Record<string, unknown>> {
  let jwt;
  try {
    jwt = decodeJwt(token);
  } catch {
    throw unauthorized("malformed_token");
  }
  if (jwt.header.alg !== "RS256") throw unauthorized("unexpected_alg");
  const kid = jwt.header.kid;
  if (typeof kid !== "string") throw unauthorized("missing_kid");

  const jwk = await resolve(kid);
  if (!jwk) throw unauthorized("unknown_kid");

  const ok = await verifyRs256(jwt, jwk);
  if (!ok) throw unauthorized("bad_signature");
  return jwt.payload;
}
