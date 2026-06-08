import type { Context } from "hono";
import type { Env } from "../env.ts";
import { readConfig } from "../config.ts";
import { mintRelaySession } from "../auth/relay-session.ts";
import { accountKeyFor } from "../routing/account-key.ts";
import {
  badRequest,
  unauthorized,
  HttpError,
  httpErrorResponse,
} from "../lib/errors.ts";
import { log } from "../lib/log.ts";

/**
 * Atlassian OAuth 2.0 (3LO) backend mediation.
 *
 * Atlassian Cloud 3LO is a CONFIDENTIAL flow: no public PKCE, and the
 * client_secret is required at the token exchange. So unlike the Google skills
 * (which exchange loopback+PKCE directly with Google), the jira/confluence skills
 * capture the auth code on the local loopback listener and POST it here; the
 * backend adds the secret and performs the exchange/refresh. Tokens are returned
 * to the client and NOT stored — the relay stays token-less.
 *
 * The third endpoint mints a short-lived relay-session for the WebSocket
 * subscription: Atlassian issues no OpenID id_token, so the client cannot bootstrap
 * the relay the way the Google skills do. Instead it presents its access token here;
 * we verify it by calling /me, derive the routing key from the verified email, and
 * mint the same HS256 relay-session the /subscribe reconnect path accepts.
 */

const ATLASSIAN_TOKEN_URL = "https://auth.atlassian.com/oauth/token";
const ATLASSIAN_ME_URL = "https://api.atlassian.com/me";

async function postToken(
  body: Record<string, string>,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(ATLASSIAN_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/** POST /oauth/atlassian/exchange — body { code, redirectUri } -> token set. */
export async function atlassianExchange(
  c: Context<{ Bindings: Env }>,
): Promise<Response> {
  const config = readConfig(c.env);
  if (!config.atlassian.clientId || !config.atlassian.clientSecret) {
    return Response.json(
      { error: "atlassian_not_configured" },
      { status: 500 },
    );
  }
  const body = (await c.req.json().catch(() => null)) as {
    code?: string;
    redirectUri?: string;
    redirect_uri?: string;
  } | null;
  const code = body?.code;
  const redirectUri = body?.redirectUri ?? body?.redirect_uri;
  if (!code || !redirectUri)
    return httpErrorResponse(badRequest("missing_code_or_redirect_uri"));

  const { ok, status, data } = await postToken({
    grant_type: "authorization_code",
    client_id: config.atlassian.clientId,
    client_secret: config.atlassian.clientSecret,
    code,
    redirect_uri: redirectUri,
  });
  if (!ok) {
    log.warn("atlassian_exchange_failed", {
      event: "atlassian_exchange_failed",
      status,
    });
    return Response.json(
      { error: "atlassian_token_error", status },
      { status: 502 },
    );
  }
  return Response.json(data);
}

/** POST /oauth/atlassian/refresh — body { refreshToken } -> rotated token set. */
export async function atlassianRefresh(
  c: Context<{ Bindings: Env }>,
): Promise<Response> {
  const config = readConfig(c.env);
  if (!config.atlassian.clientId || !config.atlassian.clientSecret) {
    return Response.json(
      { error: "atlassian_not_configured" },
      { status: 500 },
    );
  }
  const body = (await c.req.json().catch(() => null)) as {
    refreshToken?: string;
    refresh_token?: string;
  } | null;
  const refreshToken = body?.refreshToken ?? body?.refresh_token;
  if (!refreshToken)
    return httpErrorResponse(badRequest("missing_refresh_token"));

  const { ok, status, data } = await postToken({
    grant_type: "refresh_token",
    client_id: config.atlassian.clientId,
    client_secret: config.atlassian.clientSecret,
    refresh_token: refreshToken,
  });
  if (!ok) {
    log.warn("atlassian_refresh_failed", {
      event: "atlassian_refresh_failed",
      status,
    });
    return Response.json(
      { error: "atlassian_token_error", status },
      { status: 502 },
    );
  }
  return Response.json(data);
}

/**
 * POST /oauth/atlassian/relay-session — Authorization: Bearer <atlassian access token>
 * -> { session, exp, accountKey }. The routing key is derived from the /me-verified
 * email (never client-supplied), so a caller can only ever mint a session for an
 * account it actually controls.
 */
export async function atlassianRelaySession(
  c: Context<{ Bindings: Env }>,
): Promise<Response> {
  const config = readConfig(c.env);
  try {
    const authz = c.req.header("authorization");
    if (!authz || !authz.toLowerCase().startsWith("bearer "))
      throw unauthorized("missing_bearer");
    const accessToken = authz.slice(authz.indexOf(" ") + 1).trim();

    const meRes = await fetch(ATLASSIAN_ME_URL, {
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: "application/json",
      },
    });
    if (!meRes.ok) throw unauthorized("atlassian_me_failed");
    const me = (await meRes.json().catch(() => ({}))) as { email?: string };
    const email = me.email;
    if (!email) throw unauthorized("no_email_claim");

    if (config.signingKeys.length === 0) {
      return Response.json({ error: "relay_misconfigured" }, { status: 500 });
    }
    const now = Math.floor(Date.now() / 1000);
    const routingKey = await accountKeyFor("atlassian", email);
    const minted = await mintRelaySession({
      routingKey,
      ttlSeconds: config.sessionTtlSeconds,
      signingKey: config.signingKeys[0]!,
      now,
    });
    return Response.json({
      session: minted.token,
      exp: minted.exp,
      accountKey: routingKey,
    });
  } catch (err) {
    if (err instanceof HttpError) return httpErrorResponse(err);
    return Response.json({ error: "auth_failed" }, { status: 401 });
  }
}
