/**
 * Cloudflare bindings, vars and secrets available to the Worker and Durable Object.
 *
 * - `vars` come from wrangler.jsonc (public, non-secret).
 * - secrets are injected via `wrangler secret put` (production) or `.dev.vars` (local).
 * - bindings are Durable Object namespaces and KV namespaces.
 */
export interface Env {
  // --- Durable Object namespace ---
  ACCOUNT_HUB: DurableObjectNamespace;

  // --- KV namespaces ---
  /** Cache for Google's JWKS (public signing keys). Lives outside DO memory. */
  JWKS_CACHE: KVNamespace;
  /** Single-use nonce store for Google ID-token replay protection. */
  NONCE_SEEN: KVNamespace;

  // --- Public vars (wrangler.jsonc) ---
  RELAY_VERSION: string;
  PUBLIC_BASE_URL: string;
  RELAY_WS_URL: string;
  GOOGLE_CLIENT_ID: string;
  /** Per-resource OAuth scopes (space-separated); each skill requests only its own. */
  GOOGLE_SCOPES_GMAIL: string;
  GOOGLE_SCOPES_CALENDAR: string;
  GOOGLE_SCOPES_DRIVE: string;
  GOOGLE_SCOPES_SHEETS: string;
  GOOGLE_SCOPES_DOCS: string;
  SESSION_TTL_SECONDS: string;
  NONCE_WINDOW_SECONDS: string;
  CALENDAR_REQUIRE_HMAC: string;
  /** Shared Atlassian OAuth 2.0 (3LO) app client id (public). */
  ATLASSIAN_CLIENT_ID: string;
  /** Per-resource Atlassian OAuth scopes (space-separated); each skill requests its own. */
  ATLASSIAN_SCOPES_JIRA: string;
  ATLASSIAN_SCOPES_CONFLUENCE: string;

  // --- Secrets ---
  RELAY_SIGNING_KEY: string;
  /** The org Desktop OAuth client secret. A "secret" only to keep it out of git;
   *  it is non-confidential for a Desktop client and intentionally served
   *  publicly via GET /credentials/google. */
  GOOGLE_CLIENT_SECRET: string;
  RELAY_SIGNING_KEY_PREV?: string;
  CALENDAR_WEBHOOK_HMAC_KEY?: string;
  /** The Atlassian app client secret — CONFIDENTIAL. Held server-side only; used to
   *  mediate the 3LO token exchange/refresh and to verify inbound Jira webhooks.
   *  NEVER served to clients (unlike GOOGLE_CLIENT_SECRET, which is a Desktop secret). */
  ATLASSIAN_CLIENT_SECRET?: string;
}
