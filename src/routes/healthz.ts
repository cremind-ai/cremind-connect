import type { Context } from "hono";
import type { Env } from "../env.ts";

export function healthz(c: Context<{ Bindings: Env }>): Response {
  return c.json({ ok: true, version: c.env.RELAY_VERSION ?? "0.0.0" });
}
