import type { Env } from "./env.ts";
import type { ResourceId } from "./providers/types.ts";

/**
 * A validated, typed snapshot of configuration derived from {@link Env}.
 * Built once per request so route/adapter code never touches raw env strings.
 */
export interface Config {
  version: string;
  publicBaseUrl: string;
  wsUrl: string;
  google: {
    clientId: string;
    /** The org Desktop OAuth client secret (non-confidential per Google; served publicly). */
    clientSecret: string;
    /** Per-resource OAuth scopes; each skill requests only its own (least privilege). */
    resourceScopes: Partial<Record<ResourceId, string[]>>;
    gmailPubsubTopic: string;
    /** Expected `aud` claim on the Pub/Sub push OIDC JWT. */
    pubsubAudience: string;
    /** Expected `email` claim (the push subscription's service account). */
    pubsubServiceAccount: string;
  };
  sessionTtlSeconds: number;
  nonceWindowSeconds: number;
  calendar: {
    /** When true, the Calendar channel token must equal HMAC(hmacKey, channelId). */
    requireHmac: boolean;
    /** Secret for the optional HMAC channel-token check (server-side only). */
    hmacKey?: string;
  };
  /** Relay-session JWT signing keys (current + optional previous, for rotation). */
  signingKeys: string[];
}

function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function bool(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

export function readConfig(env: Env): Config {
  return {
    version: env.RELAY_VERSION ?? "0.0.0",
    publicBaseUrl: env.PUBLIC_BASE_URL ?? "https://connect.cremind.io",
    wsUrl: env.RELAY_WS_URL ?? "wss://connect.cremind.io/subscribe",
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
      resourceScopes: {
        gmail: (env.GOOGLE_SCOPES_GMAIL ?? "").split(/\s+/).filter(Boolean),
        calendar: (env.GOOGLE_SCOPES_CALENDAR ?? "").split(/\s+/).filter(Boolean),
      },
      gmailPubsubTopic: env.GMAIL_PUBSUB_TOPIC ?? "",
      pubsubAudience: env.PUBSUB_AUDIENCE ?? "",
      pubsubServiceAccount: env.PUBSUB_SA_EMAIL ?? "",
    },
    sessionTtlSeconds: int(env.SESSION_TTL_SECONDS, 3600),
    nonceWindowSeconds: int(env.NONCE_WINDOW_SECONDS, 600),
    calendar: {
      requireHmac: bool(env.CALENDAR_REQUIRE_HMAC),
      ...(env.CALENDAR_WEBHOOK_HMAC_KEY ? { hmacKey: env.CALENDAR_WEBHOOK_HMAC_KEY } : {}),
    },
    signingKeys: [env.RELAY_SIGNING_KEY, env.RELAY_SIGNING_KEY_PREV].filter(
      (k): k is string => typeof k === "string" && k.length > 0,
    ),
  };
}
