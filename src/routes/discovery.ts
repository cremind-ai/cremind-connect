import type { Context } from "hono";
import type { Env } from "../env.ts";
import { readConfig } from "../config.ts";
import { allProviders } from "../providers/registry.ts";
import { SUBPROTOCOL } from "../protocol/messages.ts";

/**
 * Public discovery document. A cremind skill fetches this to self-configure:
 * which OAuth client id + scopes to use, which webhook URL to pass to *.watch(),
 * and the relay WS URL.
 */
export function discovery(c: Context<{ Bindings: Env }>): Response {
  const config = readConfig(c.env);
  const body = {
    version: config.version,
    relay: {
      wsUrl: config.wsUrl,
      sessionTtlSeconds: config.sessionTtlSeconds,
      subprotocol: SUBPROTOCOL,
    },
    providers: allProviders().map((p) => p.describe(config)),
  };
  c.header("cache-control", "public, max-age=300");
  return c.json(body);
}
