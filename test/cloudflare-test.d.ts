/// <reference types="@cloudflare/vitest-pool-workers" />
import type { Env } from "../src/env.ts";

// Type the `env` exported from "cloudflare:test" with our bindings.
declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {}
}
