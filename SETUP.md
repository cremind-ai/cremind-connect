# Setup

cremind-connect is a token-less OAuth broker + event relay. Setup has two layers:

1. **This guide (common):** stand up the Worker on Cloudflare — KV namespaces, the
   relay signing key, base vars, custom domain, deploy.
2. **Per-provider guides:** enable each provider you need.
   - **[SETUP-GCP.md](SETUP-GCP.md)** — Google (Gmail + Calendar): OAuth consent
     screen, Desktop OAuth client, Pub/Sub, Calendar domain verification.
   - **[SETUP-ATLASSIAN.md](SETUP-ATLASSIAN.md)** — Atlassian (Jira + Confluence):
     the OAuth 2.0 (3LO) app, scopes, callback URL.

End users do none of this — they only click an OAuth consent.

## Prerequisites (common)

- A paid Cloudflare Workers plan (Durable Objects require it) on the account that
  manages `cremind.io`.
- `npm` installed; `npx wrangler login` done.
- Provider-specific tools (`gcloud` + `terraform` for Google, an Atlassian account
  for Atlassian) are listed in the per-provider guides.

---

## 1. Cloudflare — KV namespaces

```bash
npx wrangler kv namespace create JWKS_CACHE
npx wrangler kv namespace create NONCE_SEEN
```

Put the returned ids into `wrangler.jsonc` (`kv_namespaces[].id`). These back the
Google JWKS cache and ID-token replay protection; the Worker requires both
bindings regardless of which providers you enable.

## 2. Cloudflare — relay signing secret

```bash
npx wrangler secret put RELAY_SIGNING_KEY            # e.g. `openssl rand -base64 48`
# optional, during key rotation:
npx wrangler secret put RELAY_SIGNING_KEY_PREV
```

`RELAY_SIGNING_KEY` signs the short-lived relay-session JWTs that every provider's
WebSocket subscription uses. Provider OAuth secrets are set in their own guides.

## 3. Cloudflare — base vars + custom domain

In `wrangler.jsonc` confirm `PUBLIC_BASE_URL` / `RELAY_WS_URL` use
`connect.cremind.io`, then attach the custom domain (uncomment the `routes` entry
in `wrangler.jsonc`, or add it in the dashboard):

```jsonc
"routes": [{ "pattern": "connect.cremind.io", "custom_domain": true }]
```

> `workers.dev` + preview URLs are disabled so the relay is reachable ONLY at its
> canonical host (the OIDC audience the relay verifies is bound to it).

Provider-specific vars (`GOOGLE_*`, `ATLASSIAN_*`) are set in their guides.

## 4. Configure providers

Follow the guide(s) for the providers you're enabling — each adds its OAuth
app/credentials, its `wrangler.jsonc` vars, and its secrets:

- **[SETUP-GCP.md](SETUP-GCP.md)** — Google (Gmail, Calendar)
- **[SETUP-ATLASSIAN.md](SETUP-ATLASSIAN.md)** — Atlassian (Jira, Confluence)

## 5. Deploy

```bash
npm test
npx wrangler deploy
```

Or push to `main` (the `Deploy` workflow runs `wrangler deploy` with the
`CLOUDFLARE_API_TOKEN` repo secret).

## 6. Smoke test (common)

```bash
curl https://connect.cremind.io/.well-known/cremind-connect
```

Check the discovery doc returns the relay `wsUrl` and lists each provider you
configured (with its `authClientId` and per-resource scopes). Per-provider event
smoke tests are at the end of each provider guide.

## Local development

Copy `.dev.vars.example` → `.dev.vars` (gitignored), fill the secrets for the
providers you're testing, then `npx wrangler dev`.
