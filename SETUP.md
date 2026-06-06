# Setup

Two halves: **GCP** (OAuth consent + Desktop client + Pub/Sub) and **Cloudflare**
(the Worker, KV, secrets, custom domain). End users do none of this — they only
click an OAuth consent.

## Prerequisites

- A GCP project (e.g. `cremind-connect-prod`).
- A paid Cloudflare Workers plan (Durable Objects require it) on the account that
  manages `cremind.io`.
- `gcloud`, `terraform`, and `npm` installed; `npx wrangler login` done.

---

## 1. GCP — OAuth consent screen (Testing mode)

1. Console → APIs & Services → **OAuth consent screen** → User type **External**.
2. Publishing status: leave as **Testing**.
3. Add **test users** (≤100) — only these accounts can link until you go to
   production.
4. Add scopes:
   - `openid`, `.../auth/userinfo.email`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/calendar`

> Going **public** later requires Google verification + an annual CASA security
> assessment (because the client requests restricted Gmail scopes). The
> token-less relay reduces blast radius but does not waive this.

## 2. GCP — Desktop OAuth client

APIs & Services → **Credentials** → Create credentials → **OAuth client ID** →
Application type **Desktop app**. Note the **client id** (and the
non-confidential client secret). The client id goes into `GOOGLE_CLIENT_ID`
(wrangler) and the discovery doc; the local Cremind skill uses it for loopback
PKCE.

## 3. GCP — Pub/Sub + IAM (Terraform)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # edit project_id, urls
terraform init
terraform apply
```

This creates the topic, the `gmail-api-push@system` publisher binding, a push
identity service account, and an **authenticated** push subscription →
`https://connect.cremind.io/ingress/google/pubsub`. Copy the outputs into
`wrangler.jsonc` vars:

- `gmail_pubsub_topic`        → `GMAIL_PUBSUB_TOPIC`
- `push_service_account_email`→ `PUBSUB_SA_EMAIL`
- `push_audience`             → `PUBSUB_AUDIENCE`

## 4. GCP — Calendar domain verification

Calendar `events.watch()` only accepts a webhook on a verified domain. Verify
`cremind.io` in [Google Search Console](https://search.google.com/search-console)
and add it under APIs & Services → Domain verification. (DNS is on Cloudflare, so
add the TXT record there.)

---

## 5. Cloudflare — KV namespaces

```bash
npx wrangler kv namespace create JWKS_CACHE
npx wrangler kv namespace create NONCE_SEEN
```

Put the returned ids into `wrangler.jsonc` (`kv_namespaces[].id`).

## 6. Cloudflare — secrets

```bash
npx wrangler secret put RELAY_SIGNING_KEY            # e.g. `openssl rand -base64 48`
# optional:
npx wrangler secret put RELAY_SIGNING_KEY_PREV       # during key rotation
npx wrangler secret put CALENDAR_WEBHOOK_HMAC_KEY    # if CALENDAR_REQUIRE_HMAC=true
```

## 7. Cloudflare — vars + custom domain

In `wrangler.jsonc` set `GOOGLE_CLIENT_ID`, `GMAIL_PUBSUB_TOPIC`,
`PUBSUB_AUDIENCE`, `PUBSUB_SA_EMAIL`, and confirm `PUBLIC_BASE_URL` /
`RELAY_WS_URL` use `connect.cremind.io`. Attach the custom domain (uncomment the
`routes` entry in `wrangler.jsonc`, or add it in the dashboard):

```jsonc
"routes": [{ "pattern": "connect.cremind.io", "custom_domain": true }]
```

## 8. Deploy

```bash
npm test
npx wrangler deploy
```

Or push to `main` (the `Deploy` workflow runs `wrangler deploy` with the
`CLOUDFLARE_API_TOKEN` repo secret).

---

## 9. Smoke test (real account)

1. `curl https://connect.cremind.io/.well-known/cremind-connect` → check the
   discovery doc.
2. With a test-user account's own token, call `users.watch()` against the topic.
3. Connect a WebSocket client to `/subscribe` with that account's Google ID token;
   expect a `hello` message.
4. Send yourself an email → expect a `{"type":"resync","source":"gmail"}` nudge.
5. Forge a Pub/Sub push (wrong/absent OIDC JWT) → expect `401/403`.
