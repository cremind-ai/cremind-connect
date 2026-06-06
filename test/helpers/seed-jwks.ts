import { env } from "cloudflare:test";
import type { Env } from "../../src/env.ts";
import type { FakeIssuer } from "./fake-google-keys.ts";

/**
 * Pre-seed the JWKS cache in KV so the Worker's key resolver finds our fake
 * issuer's public key without any network fetch. Mirrors the cache format used by
 * googleKeyResolver().
 */
export async function seedJwks(issuer: FakeIssuer): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await (env as unknown as Env).JWKS_CACHE.put(
    "google_certs",
    JSON.stringify({ keys: issuer.jwks.keys, expiresAt: now + 3600 }),
  );
}
