# cremind-connect

A **token-less OAuth broker + event relay** for [Cremind](https://github.com/cremind-ai).
It lets a user's local Cremind app link Google accounts (Gmail, Calendar, Drive, …) and
receive live events — **without this service ever storing, or even seeing, an
OAuth access or refresh token**.

It runs on Cloudflare Workers + Durable Objects and is deployed with Wrangler. It
is intentionally small, public, and auditable: anyone can read this repo and the
[`terraform/`](terraform/) to confirm exactly what it does (relay notifications)
and does not do (hold user data).

## Why it exists

Google push notifications require infrastructure an end user can't self-provision:
a **Pub/Sub topic** (Gmail) and a **webhook domain** (Calendar) owned by an
organization, plus a verified **OAuth consent screen**. `cremind-connect` owns
exactly those org-level pieces and nothing else.

## The key idea: two planes

```
AUTHORIZATION PLANE  (this service is NOT in the token path)
  local app  ──loopback PKCE auth code──▶  Google      (org's Desktop OAuth client)
  local app  ◀──── access + refresh + id_token ────────  tokens stored LOCALLY only

EVENT PLANE  (this service is a token-less relay)
  local app  ──users.watch()  → org Pub/Sub topic ─▶ Gmail ─┐ Pub/Sub push (OIDC JWT)
  local app  ──events.watch() → org webhook URL ───▶ Calendar ─┐ webhook
                                                       ▼        ▼
                                          ┌──────────────────────────────┐
                                          │   cremind-connect (Worker)    │
                                          │  verify → hash(email)=key →   │
                                          │  Durable Object AccountHub    │
                                          │  broadcasts {type:"resync"}   │
                                          └───────────┬──────────────────┘
                                  WebSocket nudge (no tokens, no Google data)
                       ┌──────────────────────────────┼───────────────────────┐
                       ▼                               ▼                        ▼
                   App A (abc@gmail)            App B (abc@gmail)         App C (xyz@gmail)
                   each syncs locally with ITS OWN token (history.list / events.list)
```

A notification for an account is fanned out to **every** app that proved control
of that account — so two users who independently linked `abc@gmail.com` both get
the event. See [DESIGN.md](DESIGN.md).

## Does it store tokens?

**No.** The local app mints tokens directly with Google via loopback PKCE and
keeps them on the user's machine. The relay only needs to (a) publish a discovery
document and (b) verify and fan out Google's pushes — neither requires a user
token. The only genuine secret the relay holds is its own relay-session signing
key; it also carries the public OAuth client id and (non-confidential, Desktop)
client secret and serves both from `/credentials/google`. It is **stateless at rest**: routing keys are
derived from the event payload, subscriber connections are ephemeral, and missed
nudges self-heal because offline apps re-sync on reconnect.

## Develop

```bash
npm install
npm test            # vitest + @cloudflare/vitest-pool-workers (Miniflare)
npm run typecheck
npm run dev         # wrangler dev on http://localhost:8787
npm run deploy:dry  # bundle check
```

Endpoints:

| Route | Purpose |
|---|---|
| `GET /.well-known/cremind-connect` | Discovery doc (client id, scopes, topic, webhook URL, ws URL). |
| `GET /credentials/google` | Public OAuth client id + secret (served so the org can rotate them). |
| `GET /subscribe?account=<key>` | WebSocket; Google ID token (bootstrap) or relay-session (reconnect). |
| `POST /ingress/google/pubsub` | Gmail Pub/Sub push receiver (verifies OIDC JWT). |
| `POST /ingress/google/calendar` | Calendar webhook receiver. |
| `POST /ingress/google/drive` | Drive changes.watch webhook receiver. |
| `GET /healthz` | Liveness. |

## Deploy

Requires a paid Cloudflare Workers plan (Durable Objects). [SETUP.md](SETUP.md)
covers the shared Cloudflare base (KV namespaces, relay signing key, custom domain
`connect.cremind.io`, deploy); per-provider guides cover the rest:
[SETUP-GCP.md](SETUP-GCP.md) (Google — consent screen, Desktop OAuth client,
Pub/Sub via [`terraform/`](terraform/), Calendar domain verification) and
[SETUP-ATLASSIAN.md](SETUP-ATLASSIAN.md) (Atlassian — OAuth 2.0 (3LO) app, scopes,
callback URL).

## Extending to other providers

Providers are pluggable (ports & adapters). Adding GitHub/Microsoft/etc. is a new
module under `src/providers/<id>/` plus two registry entries — no changes to the
routes or the Durable Object. See [DESIGN.md](DESIGN.md#extensibility).

## License

MIT — see [LICENSE](LICENSE).
