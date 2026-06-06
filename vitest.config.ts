import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

// Tests run inside workerd (Miniflare) so Durable Objects, WebSockets, KV and
// WebCrypto behave exactly as in production.
export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        // Each test gets fresh KV/DO storage (rolled back between tests).
        isolatedStorage: true,
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          // Deterministic, test-only secrets/vars. Production uses `wrangler secret put`
          // and wrangler.jsonc vars. These override the placeholders so the fake
          // issuer's token claims (aud / service-account) line up.
          bindings: {
            RELAY_SIGNING_KEY: "test-signing-key-do-not-use-in-prod",
            RELAY_SIGNING_KEY_PREV: "",
            CALENDAR_WEBHOOK_HMAC_KEY: "test-hmac-key",
            GOOGLE_CLIENT_ID: "test-client.apps.googleusercontent.com",
            PUBSUB_AUDIENCE: "https://connect.test/ingress/google/pubsub",
            PUBSUB_SA_EMAIL: "push@test.iam.gserviceaccount.com",
            GMAIL_PUBSUB_TOPIC: "projects/test/topics/gmail-watch",
            PUBLIC_BASE_URL: "https://connect.test",
            RELAY_WS_URL: "wss://connect.test/subscribe",
          },
        },
      },
    },
  },
});
