import type { Env } from "./env.ts";
import { createApp } from "./app.ts";

// Durable Object class must be exported from the Worker entry module.
export { AccountHub } from "./durable/account-hub.ts";

const app = createApp();

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
