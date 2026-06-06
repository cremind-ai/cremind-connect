import type { Context } from "hono";
import type { Env } from "../env.ts";
import { readConfig } from "../config.ts";
import { googleKeyResolver } from "../auth/jwks.ts";
import { verifyGoogleIdToken } from "../auth/verify-google-id.ts";
import { verifyRelaySession, mintRelaySession } from "../auth/relay-session.ts";
import { accountKeyFor } from "../routing/account-key.ts";
import { hubStub } from "../durable/client.ts";
import { HttpError, httpErrorResponse } from "../lib/errors.ts";

/**
 * GET /subscribe?account=<routingKey>&resources=gmail,calendar
 *
 * Two auth paths:
 *  - Reconnect: header `X-Cremind-Session: <relay-session JWT>` (cheap, no Google round trip).
 *  - Bootstrap: header `Authorization: Bearer <Google ID token>` — verified (aud=client_id,
 *    exp, email_verified, single-use nonce); the routing key is derived from the verified
 *    email and must match the requested account. A fresh relay-session is minted and sent
 *    to the client in the first `hello` WS message.
 *
 * On success the upgrade is forwarded to the account's Durable Object hub.
 */
export async function subscribe(c: Context<{ Bindings: Env }>): Promise<Response> {
  const req = c.req.raw;
  if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return c.text("expected websocket", 426);
  }

  const config = readConfig(c.env);
  const url = new URL(req.url);
  const requestedAccount = url.searchParams.get("account") ?? "";
  const resources = url.searchParams.get("resources") ?? "";
  const now = Math.floor(Date.now() / 1000);

  let routingKey: string;
  let session: string;
  let sessionExp: number;

  const sessionHeader = req.headers.get("x-cremind-session");
  if (sessionHeader) {
    const s = await verifyRelaySession(sessionHeader, { keys: config.signingKeys, now });
    if (!s) return c.json({ error: "bad_session" }, 401);
    routingKey = s.routingKey;
    session = sessionHeader;
    sessionExp = s.exp;
  } else {
    const authz = req.headers.get("authorization");
    if (!authz || !authz.toLowerCase().startsWith("bearer ")) {
      return c.json({ error: "missing_credential" }, 401);
    }
    const idToken = authz.slice(authz.indexOf(" ") + 1).trim();
    try {
      const claims = await verifyGoogleIdToken(idToken, {
        resolve: googleKeyResolver(c.env),
        clientId: config.google.clientId,
        now,
      });

      // Single-use nonce replay protection.
      if (claims.nonce) {
        const nonceKey = `n:${claims.nonce}`;
        if (await c.env.NONCE_SEEN.get(nonceKey)) {
          return c.json({ error: "nonce_replayed" }, 401);
        }
        const ttl = Math.max(60, Math.min(config.nonceWindowSeconds, claims.exp - now));
        await c.env.NONCE_SEEN.put(nonceKey, "1", { expirationTtl: ttl });
      }

      routingKey = await accountKeyFor("google", claims.email);
      if (requestedAccount && requestedAccount !== routingKey) {
        return c.json({ error: "account_mismatch" }, 403);
      }
      if (config.signingKeys.length === 0) return c.json({ error: "relay_misconfigured" }, 500);
      const minted = await mintRelaySession({
        routingKey,
        ttlSeconds: config.sessionTtlSeconds,
        signingKey: config.signingKeys[0]!,
        now,
      });
      session = minted.token;
      sessionExp = minted.exp;
    } catch (err) {
      if (err instanceof HttpError) return httpErrorResponse(err);
      return c.json({ error: "auth_failed" }, 401);
    }
  }

  // Forward the upgrade to the account hub, carrying the connection metadata.
  const headers = new Headers(req.headers);
  headers.set("X-Sub-Resources", resources);
  headers.set("X-Sub-Session", session);
  headers.set("X-Sub-Session-Exp", String(sessionExp));
  headers.set("X-Sub-Conn-Id", crypto.randomUUID().slice(0, 8));

  const forwarded = new Request(req.url, { method: "GET", headers });
  return hubStub(c.env, routingKey).fetch(forwarded);
}
