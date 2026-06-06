import type { Config } from "../config.ts";
import type { KeyResolver } from "../auth/jwks.ts";

/**
 * Ports & adapters core. Providers and their ingress mechanisms are pluggable so
 * adding GitHub/Microsoft/etc. later is a new module, not a change to routes or
 * the Durable Object.
 */
export type ProviderId = "google";
export type ResourceId = "gmail" | "calendar"; // future: "drive"

/** The normalized result of verifying + parsing one inbound provider push. */
export interface Notification {
  /** base32 routing key identifying the per-account Durable Object hub. */
  accountKey: string;
  provider: ProviderId;
  /** Which resource changed; sent in the broadcast so one hub serves all resources. */
  resource: ResourceId;
  /**
   * Non-authoritative hint (kept OUT of the client nudge for privacy; useful for
   * server-side logging/metrics only). Clients always do their own incremental sync.
   */
  cursorHint?: Record<string, string | number>;
}

/** Minimal request view an ingress adapter needs (decouples adapters from Hono). */
export interface IngressRequest {
  header(name: string): string | undefined;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

/** Per-request services handed to an ingress adapter. */
export interface IngressContext {
  config: Config;
  /** Resolves a Google signing key by `kid` (KV-cached JWKS). */
  resolveKey: KeyResolver;
  now(): number;
}

/**
 * An ingress adapter verifies authenticity and parses one push into a Notification.
 * - Throw {@link HttpError} (401/403) on auth failure, (400) on malformed input.
 * - Return `null` for "accepted, nothing to broadcast" (handshake / duplicate).
 */
export interface IngressAdapter {
  readonly id: string; // e.g. "google/pubsub", "google/calendar"
  handle(req: IngressRequest, ctx: IngressContext): Promise<Notification | null>;
}

/** Static provider metadata used to build the discovery document. */
export interface Provider {
  readonly id: ProviderId;
  describe(config: Config): ProviderDiscovery;
}

export interface ResourceDiscovery {
  resource: ResourceId;
  /** Gmail: the org Pub/Sub topic the client passes to users.watch(). */
  pubsubTopic?: string;
  /** Calendar: the webhook URL the client passes to events.watch().address. */
  webhookUrl?: string;
}

export interface ProviderDiscovery {
  provider: ProviderId;
  /** The org "Desktop" OAuth client id (public by design). */
  authClientId: string;
  scopes: string[];
  resources: ResourceDiscovery[];
}
