import type { Context } from "hono";
import type { Env } from "../env.ts";
import type { IngressRequest } from "../providers/types.ts";
import { readConfig } from "../config.ts";
import { ingressFor } from "../providers/registry.ts";
import { googleKeyResolver } from "../auth/jwks.ts";
import { broadcastToHub } from "../durable/client.ts";
import { HttpError, httpErrorResponse } from "../lib/errors.ts";
import { log } from "../lib/log.ts";

function toIngressRequest(req: Request): IngressRequest {
  const url = new URL(req.url);
  return {
    header: (name: string) => req.headers.get(name) ?? undefined,
    query: (name: string) => url.searchParams.get(name) ?? undefined,
    json: () => req.clone().json(),
    text: () => req.clone().text(),
  };
}

/**
 * POST /ingress/:provider/:mechanism — receive a provider push, verify it, and
 * fan a resync nudge out to the account's hub.
 *
 * Status policy:
 *  - 200  accepted + (maybe) delivered  -> acks the push, no retry
 *  - 204  handshake / nothing to broadcast -> acks, no retry
 *  - 401/403/400  auth failure / malformed -> surfaced (testable; legitimate
 *         Google traffic never trips these once configured)
 *  - 500  transient internal error -> push is redelivered
 */
export async function ingress(c: Context<{ Bindings: Env }>): Promise<Response> {
  const provider = c.req.param("provider");
  const mechanism = c.req.param("mechanism");
  if (!provider || !mechanism) return c.json({ error: "unknown_ingress" }, 404);
  const adapter = ingressFor(provider, mechanism);
  if (!adapter) return c.json({ error: "unknown_ingress" }, 404);

  const config = readConfig(c.env);
  const ctx = {
    config,
    resolveKey: googleKeyResolver(c.env),
    now: () => Math.floor(Date.now() / 1000),
  };

  try {
    const note = await adapter.handle(toIngressRequest(c.req.raw), ctx);
    if (!note) return c.body(null, 204);
    const delivered = await broadcastToHub(c.env, note);
    log.info("ingress", {
      event: "ingress",
      route: adapter.id,
      accountKey: note.accountKey,
      resource: note.resource,
      delivered,
    });
    return c.json({ ok: true, delivered });
  } catch (err) {
    if (err instanceof HttpError) {
      log.warn("ingress_rejected", {
        event: "ingress_rejected",
        route: adapter.id,
        code: err.code,
        status: err.status,
      });
      return httpErrorResponse(err);
    }
    log.error("ingress_error", { event: "ingress_error", route: adapter.id });
    return c.json({ error: "internal_error" }, 500);
  }
}
