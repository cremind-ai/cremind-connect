import { signHs256, verifyHs256 } from "./jwt.ts";

/**
 * Short-lived relay-session JWT (HS256). Issued after a successful Google
 * ID-token bootstrap so a client can reconnect cheaply without re-presenting a
 * Google credential. `sub` is the routing key (a hash of the email), so the token
 * carries no PII.
 */
export const RELAY_AUDIENCE = "cremind-connect-ws";

export interface MintOptions {
  routingKey: string;
  ttlSeconds: number;
  signingKey: string;
  now: number; // unix seconds
}

export interface RelaySession {
  routingKey: string;
  exp: number;
}

export async function mintRelaySession(opts: MintOptions): Promise<{ token: string; exp: number }> {
  const exp = opts.now + opts.ttlSeconds;
  const token = await signHs256(
    {
      sub: opts.routingKey,
      aud: RELAY_AUDIENCE,
      iat: opts.now,
      exp,
    },
    opts.signingKey,
  );
  return { token, exp };
}

/**
 * Verify a relay-session JWT against the current and (optional) previous signing
 * key, supporting zero-downtime key rotation. Returns the session or null.
 */
export async function verifyRelaySession(
  token: string,
  opts: { keys: (string | undefined)[]; now: number },
): Promise<RelaySession | null> {
  for (const key of opts.keys) {
    if (!key) continue;
    const payload = await verifyHs256(token, key);
    if (!payload) continue;
    if (payload.aud !== RELAY_AUDIENCE) return null;
    const exp = Number(payload.exp);
    if (!Number.isFinite(exp) || exp < opts.now) return null;
    const sub = payload.sub;
    if (typeof sub !== "string" || sub.length === 0) return null;
    return { routingKey: sub, exp };
  }
  return null;
}
