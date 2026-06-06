import { Hono } from "hono";
import type { Env } from "./env.ts";
import { healthz } from "./routes/healthz.ts";
import { discovery } from "./routes/discovery.ts";
import { ingress } from "./routes/ingress.ts";
import { subscribe } from "./routes/subscribe.ts";
import { httpErrorResponse, HttpError } from "./lib/errors.ts";
import { log } from "./lib/log.ts";

export function createApp(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  app.get("/healthz", healthz);
  app.get("/.well-known/cremind-connect", discovery);
  app.post("/ingress/:provider/:mechanism", ingress);
  app.get("/subscribe", subscribe);

  app.notFound((c) => c.json({ error: "not_found" }, 404));

  app.onError((err, c) => {
    if (err instanceof HttpError) return httpErrorResponse(err);
    log.error("unhandled_error", { event: "unhandled_error" });
    return c.json({ error: "internal_error" }, 500);
  });

  return app;
}
