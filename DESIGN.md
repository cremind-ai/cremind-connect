# cremind-connect — Design

## Goals

1. Let Cremind users link Google accounts with a single OAuth consent, no GCP setup.
2. Deliver Google push events to the user's local app(s) in real time.
3. **Never store or handle user OAuth tokens** on the server.
4. **Fan one account's events out to every app that linked it** (shared-account case).
5. Be general-purpose (multi-provider) and trivially auditable.

## Two planes

### Authorization plane — the server is not in the token path

The Cremind org registers one **Desktop** OAuth client. The local app:

1. generates a PKCE verifier/challenge and a `nonce`;
2. opens the system browser to Google's consent screen
   (`client_id` from the discovery doc, `redirect_uri=http://127.0.0.1:<port>`,
   `scope=openid email <gmail/calendar scopes>`, `access_type=offline`);
3. catches the `code` on a loopback listener and exchanges it **directly** with
   `https://oauth2.googleapis.com/token` using the verifier.

Google supports loopback + PKCE for Desktop clients and treats the Desktop
client_secret as non-confidential, so the exchange needs no confidential server.
Tokens (and an `id_token`) are stored **only** on the user's machine. The relay
never sees them. (Verified: developers.google.com/identity/protocols/oauth2/native-app.)

### Event plane — a token-less relay

The local app's listener calls, with its **own** token:

- **Gmail** `users.watch({ topicName: <org topic> })` — all users publish into the
  org's single Pub/Sub topic (topic grants `pubsub.publisher` only to
  `gmail-api-push@system.gserviceaccount.com`; users need no GCP access). Google
  pushes `{emailAddress, historyId}` to `/ingress/google/pubsub` with a
  Google-signed OIDC JWT the relay verifies.
- **Calendar** `events.watch({ address: <org webhook>, id: cm.<key>.<nonce> })`.
  Google POSTs header-only notifications to `/ingress/google/calendar`.

The relay derives `routingKey = base32(sha256("google:" + lower(trim(email)))[:16])`,
routes to Durable Object `AccountHub(routingKey)`, and broadcasts a nudge
`{type:"resync", source}` to every connected app. Each app then performs its own
incremental sync (`history.list` / `events.list`) locally with its own token.

Watch renewal (≤7-day expiry) is the **app's** responsibility (its always-on
listener), not the relay's — so the relay holds no per-user lifecycle state.

## Why no token storage is needed

| Capability | Who does it | Needs a user token? | On the relay? |
|---|---|---|---|
| Mint tokens | local app (PKCE) | — | no |
| Call/renew watch | local app | yes (its own) | no |
| Receive push | relay | no (verifies Google's OIDC JWT) | — |
| Fetch changes | local app | yes (its own) | no |
| Refresh token | local app | yes (its own) | no |
| Route events | relay | no (hash of email from payload) | derived, not stored |

The relay's only secrets are the **relay-session signing key** and the **public**
OAuth client id (plus an optional Calendar HMAC key). No access/refresh tokens,
ever.

## Routing & fan-out

- DO name = `routingKey` (one hub per Google account), addressed deterministically
  via `idFromName` — no database.
- Gmail: relay computes the key from the push's `emailAddress`.
- Calendar: the app embeds the key in the channel id (`cm.<key>.<nonce>`, ≤64 chars);
  the relay parses it from `X-Goog-Channel-ID`. No stored channel→account mapping.
- One hub multiplexes all resources for an account (gmail, calendar, future drive);
  the nudge carries `source` so the app syncs only the changed surface.
- 128-bit truncated hash → collision probability ≈ 1.5e-27 at 1e6 accounts.

### Subscription access control

Routing by `hash(email)` alone would let anyone who knows an email join its hub.
So `/subscribe` requires proof of control: the app presents a Google **ID token**
(`openid email`). The relay verifies signature, `aud == client_id`, `exp`,
`email_verified`, and a single-use `nonce`, then requires
`accountKeyFor(email) == requested account`. It then issues a short-lived
**relay-session JWT** (HS256, `sub = routingKey`) for cheap reconnects. An ID
token proves account control but grants no API access, so the relay sees only a
verifiable identity assertion, transiently — never an access/refresh token.

## Statelessness & offline behavior

The relay is **stateless at rest**: subscriber connections live only in the DO's
in-memory (hibernatable) socket set; routing keys are derived per-event. If no app
is connected when an event arrives, the nudge is dropped — and that is correct:
on reconnect the app re-establishes its watch and does a catch-up incremental
sync. The relay is a real-time accelerator, not a durable queue. (If Gmail's
`historyId` is too old after a long offline period, the app falls back to a
bounded recent resync — an app-side concern.)

## Security model / threat analysis

- **Forged/replayed Pub/Sub push** → rejected: full OIDC verification (signature
  via cached JWKS, `iss`, exact `aud`, exact service-account `email`, `exp`).
- **Forged Calendar webhook** (unsigned by Google) → low impact: it can at most
  trigger a redundant, *authorized* re-sync on the client (which always pulls with
  its own token — no data leaks). Routing requires a structurally valid `cm.<key>`
  channel id; optional `CALENDAR_REQUIRE_HMAC` makes the channel token verifiable.
- **ID-token replay** → single-use `nonce` stored in KV until `exp`; `aud` pinned
  to our client id; short relay-session TTL.
- **Cross-account leakage** → a subscriber may only join the hub whose key matches
  its verified email; the nudge contains zero Google data.
- **JWKS handling** → cached in KV/Cache (not DO memory, which hibernation clears);
  `kid` miss forces one refresh+retry to ride key rotation.

## Privacy posture — what the relay can see (and never keeps)

| Data | Source | Handling |
|---|---|---|
| account email | Gmail push `emailAddress`; ID-token `email` | hashed to routingKey, then discarded; never stored/logged |
| Gmail `historyId` | push payload | used as an optional log-free hint; never sent to clients |
| Calendar channel headers | webhook | routingKey parsed; not stored |
| OAuth access/refresh tokens | — | **never seen** |

Logging uses a field allowlist (`src/lib/log.ts`): only the derived `routingKey`
(already a hash) and counts are logged — never email, historyId, tokens, or JWTs.

## Extensibility

`src/providers/types.ts` defines the ports:

- `Provider.describe(config)` contributes a section to the discovery doc.
- `IngressAdapter.handle(req, ctx)` verifies + parses one push into a normalized
  `Notification { accountKey, provider, resource, cursorHint? }`.

Adding a provider = a module under `src/providers/<id>/` + entries in
`src/providers/registry.ts`. Routes and the Durable Object are provider-agnostic.
Poll-only resources (Contacts/Sheets/Docs — no push API) simply register no
ingress adapter; those skills poll client-side and use the relay only for OAuth
discovery.

## Operational notes

- Durable Objects require a paid Workers plan.
- A single DO holds up to 32,768 WebSockets; sharding (`idFromName(key+":"+i)`) is
  a future option, dormant by default (implausible for a personal-app product).
- `gmail.modify`/`gmail.send` are **restricted** scopes: development uses the
  consent screen in "Testing" mode (≤100 test users, no CASA); public launch
  requires Google verification + an annual CASA assessment regardless of this
  token-less design (the *client* still requests the scopes).
