import { base32Encode } from "../lib/base32.ts";

/**
 * Routing-key derivation. THE most security- and correctness-critical code in the
 * relay: it decides which Durable Object hub an account's events fan out to.
 *
 * routingKey(provider, email) = base32( sha256(provider + ":" + normalizeEmail(email))[:16] )
 *
 * The 16-byte (128-bit) slice makes collisions astronomically unlikely
 * (~1.5e-27 at 1e6 accounts) while keeping the key short (26 chars) so it fits in
 * a Google Calendar channel id (<= 64 chars).
 *
 * This MUST stay byte-identical to the Python implementation used by the cremind
 * skills (shared golden vectors), or nudges route to the wrong hub and silently
 * never arrive.
 */
export type Provider = "google" | "atlassian";

/**
 * Normalize an email for hashing.
 *
 * We lowercase and trim only. We deliberately do NOT collapse Gmail dots/`+suffix`:
 * that rule is Gmail-consumer-specific and applying it to Google Workspace domains
 * would merge distinct accounts. The relay always derives the key from a
 * Google-verified `email` claim or the Gmail Pub/Sub `emailAddress`, so the input
 * is already the canonical account address.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const encoder = new TextEncoder();

export async function accountKeyFor(provider: Provider, email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const data = encoder.encode(`${provider}:${normalized}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const slice = new Uint8Array(digest).subarray(0, 16);
  return base32Encode(slice);
}
