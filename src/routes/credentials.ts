import type { Context } from "hono";
import type { Env } from "../env.ts";
import { readConfig } from "../config.ts";
import { notFound } from "../lib/errors.ts";

/**
 * Public OAuth client credentials for a provider. Served so the org can rotate
 * the client id/secret centrally without pushing a client update — the gmail /
 * gcalendar skills fetch this at link time.
 *
 * Public by design: the client is a Google *Desktop* OAuth client, whose
 * client_secret Google explicitly treats as non-confidential (see DESIGN.md).
 * If the org ever moves to a confidential "Web application" client, this
 * endpoint must be removed and the secret kept server-side.
 */
export function credentials(c: Context<{ Bindings: Env }>): Response {
  if (c.req.param("provider") !== "google") throw notFound("unknown_provider");
  const config = readConfig(c.env);
  c.header("cache-control", "public, max-age=300");
  return c.json({
    provider: "google",
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
  });
}
