# Setup — GCP (Google: Gmail + Calendar)

Provider guide for Google. Do the common Cloudflare base in **[SETUP.md](SETUP.md)**
first. This covers the GCP OAuth consent screen, Desktop OAuth client, Pub/Sub, and
Calendar domain verification, plus the Google-specific Cloudflare vars/secrets.

## Prerequisites

- A GCP project (e.g. `cremind-connect-prod`).
- `gcloud` and `terraform` installed.

---

## 1. OAuth consent screen (Testing mode)

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

## 2. Desktop OAuth client

APIs & Services → **Credentials** → Create credentials → **OAuth client ID** →
Application type **Desktop app**. Note the **client id** and the
non-confidential **client secret**. The client id goes into `GOOGLE_CLIENT_ID`
(a public `var` in `wrangler.jsonc`); the client secret is set with `wrangler
secret put GOOGLE_CLIENT_SECRET` (§5) — it is non-confidential for a Desktop
client but kept out of git. The relay serves **both** from `GET
/credentials/google`, and the local Cremind skill fetches them for the loopback
PKCE flow. Because the skills load these dynamically, rotating the secret later
is just another `wrangler secret put` (and the client id a one-line
`wrangler.jsonc` change) — no client update needed.

## 3. Pub/Sub + IAM (Terraform)

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

- `gmail_pubsub_topic` → `GMAIL_PUBSUB_TOPIC`
- `push_service_account_email`→ `PUBSUB_SA_EMAIL`
- `push_audience` → `PUBSUB_AUDIENCE`

## 4. Calendar domain verification

Calendar `events.watch()` only accepts a webhook on a verified domain. Verify
`cremind.io` in [Google Search Console](https://search.google.com/search-console)
and add it under APIs & Services → Domain verification. (DNS is on Cloudflare, so
add the TXT record there.)

---

## 5. Cloudflare — Google secrets

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET         # Desktop client secret; served publicly via /credentials/google
# optional:
npx wrangler secret put CALENDAR_WEBHOOK_HMAC_KEY    # if CALENDAR_REQUIRE_HMAC=true
```

## 6. Cloudflare — Google vars

In `wrangler.jsonc` set `GOOGLE_CLIENT_ID`, `GMAIL_PUBSUB_TOPIC`,
`PUBSUB_AUDIENCE`, `PUBSUB_SA_EMAIL`, and the scope vars `GOOGLE_SCOPES_GMAIL` /
`GOOGLE_SCOPES_CALENDAR`.

Then deploy per [SETUP.md → Deploy](SETUP.md#5-deploy).

---

## 7. Smoke test (real account)

1. `curl https://connect.cremind.io/.well-known/cremind-connect` → check the
   discovery doc.
2. With a test-user account's own token, call `users.watch()` against the topic.
3. Connect a WebSocket client to `/subscribe` with that account's Google ID token;
   expect a `hello` message.
4. Send yourself an email → expect a `{"type":"resync","source":"gmail"}` nudge.
5. Forge a Pub/Sub push (wrong/absent OIDC JWT) → expect `401/403`.
