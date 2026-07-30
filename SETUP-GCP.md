# Setup — GCP (Google: Gmail, Calendar, Drive, Sheets, Docs)

Provider guide for Google. Do the common Cloudflare base in **[SETUP.md](SETUP.md)**
first. This covers the GCP OAuth consent screen, Desktop OAuth client, and
Calendar/Drive domain verification, plus the Google-specific Cloudflare
vars/secrets.

## Prerequisites

- A GCP project (e.g. `cremind-connect-prod`).
- `gcloud` and `terraform` installed.

## 0. Enable the Google APIs

```bash
gcloud services enable \
  gmail.googleapis.com calendar-json.googleapis.com \
  drive.googleapis.com sheets.googleapis.com docs.googleapis.com \
  --project <project-id>
```

[`terraform/`](terraform/) declares the same enablement for auditability; it is
the whole of the GCP-side infrastructure, so running it is optional if you used
the command above.

---

## 1. OAuth consent screen (Testing mode)

1. Console → APIs & Services → **OAuth consent screen** → User type **External**.
2. Publishing status: leave as **Testing**.
3. Add **test users** (≤100) — only these accounts can link until you go to
   production.
4. Add scopes (Console-only — the OAuth consent screen has **no** gcloud/API
   surface, so this step must be done in the web Console):
   - `openid`, `.../auth/userinfo.email`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/documents`

> Going **public** requires Google verification. Every scope above is
> *sensitive*; **none is restricted**, so verification applies but no third-party
> security assessment (CASA) does — that requirement attaches only to restricted
> scopes. See Google's
> [scope tiers and verification requirements](https://support.google.com/cloud/answer/13807380).
> Keep it that way: adding a restricted scope (`gmail.readonly`, full `drive`, …)
> would pull the shared client into a recurring paid CASA assessment.

## 2. Desktop OAuth client

APIs & Services → **Credentials** → Create credentials → **OAuth client ID** →
Application type **Desktop app**. Note the **client id** and the
non-confidential **client secret**. The client id goes into `GOOGLE_CLIENT_ID`
(a public `var` in `wrangler.jsonc`); the client secret is set with `wrangler
secret put GOOGLE_CLIENT_SECRET` (§4) — it is non-confidential for a Desktop
client but kept out of git. The relay serves **both** from `GET
/credentials/google`, and the local Cremind skill fetches them for the loopback
PKCE flow. Because the skills load these dynamically, rotating the secret later
is just another `wrangler secret put` (and the client id a one-line
`wrangler.jsonc` change) — no client update needed.

## 3. Calendar/Drive domain verification

Calendar `events.watch()` and Drive `changes.watch()` only accept a webhook on a
verified domain. Verify `cremind.io` in
[Google Search Console](https://search.google.com/search-console) and add it
under APIs & Services → Domain verification. (DNS is on Cloudflare, so add the
TXT record there.) Both push mechanisms POST to the same `cremind.io` host, so a
single verification covers Calendar and Drive.

---

## 4. Cloudflare — Google secrets

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET         # Desktop client secret; served publicly via /credentials/google
# optional:
npx wrangler secret put CALENDAR_WEBHOOK_HMAC_KEY    # if CALENDAR_REQUIRE_HMAC=true
```

## 5. Cloudflare — Google vars

In `wrangler.jsonc` set `GOOGLE_CLIENT_ID` and the scope vars
`GOOGLE_SCOPES_GMAIL`, `GOOGLE_SCOPES_CALENDAR`, `GOOGLE_SCOPES_DRIVE`,
`GOOGLE_SCOPES_SHEETS`, `GOOGLE_SCOPES_DOCS`.

Drive push reuses the Calendar `web_hook` channel pipeline (`/ingress/google/drive`)
and the same optional `CALENDAR_REQUIRE_HMAC` / `CALENDAR_WEBHOOK_HMAC_KEY` knob.
Sheets and Docs are poll-only (no push API), so they register scopes but no
ingress. Gmail is **send-only**: with no restricted scope the client cannot read a
mailbox or call `users.watch()`, so Gmail has no ingress either — the app's
`imap-email` skill covers mailbox reading and live mail events over IMAP with an
app password.

**Drive is per-file.** `drive.file` grants access to individual files, not the
drive: the app opens Google's file picker (its authorization request carries
`trigger_onepick=true`), and only files the user picks there — plus files Cremind
itself creates — are ever reachable. Knowing a file's URL is not sufficient. The
`changes.watch` feed still works, but reports only those granted files.

Then deploy per [SETUP.md → Deploy](SETUP.md#5-deploy).

---

## 6. Smoke test (real account)

1. `curl https://connect.cremind.io/.well-known/cremind-connect` → check the
   discovery doc.
2. With a test-user account's own token, call Calendar `events.watch()` against
   the discovery doc's `webhookUrl`, using channel id `cm-<routingKey>-<nonce>`.
3. Connect a WebSocket client to `/subscribe?resources=calendar` with that
   account's Google ID token; expect a `hello` message.
4. Change an event on that calendar → expect a
   `{"type":"resync","source":"calendar"}` nudge.
5. POST a webhook with a channel id that isn't `cm-…` → expect `400`.
