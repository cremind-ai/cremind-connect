# Setup — Atlassian (Jira + Confluence)

Provider guide for Atlassian. Do the common Cloudflare base in **[SETUP.md](SETUP.md)**
first. **One** OAuth 2.0 (3LO) app covers both the `jira` and `confluence` skills.

Unlike Google's Desktop client, Atlassian Cloud 3LO is a **confidential** flow (no
public PKCE; the client secret is required at the token exchange). So
cremind-connect **mediates** the code→token exchange and refresh, holding the
secret server-side — but tokens still live only on the user's machine, and the
relay stores nothing.

> **Events.** Jira change events use dynamic webhooks (Phase 1, implemented).
> Confluence has **no** webhook path for OAuth (3LO) apps, and Atlassian Connect is
> end-of-support — so Confluence real-time events are deferred to a later **Forge**
> app (Phase 2). Confluence is API-only today; poll via `search`/`pages`.

> **⚠️ Jira event delivery requires Distribution (make the app public).** For a
> _private_ OAuth 2.0 app, Atlassian delivers dynamic webhooks **only when the app
> owner matches the user who registered them** — so a private app delivers nothing
> to end-users who authorize it: registration still succeeds and the webhook lists
> fine, but events are never queued (and `GET /rest/api/3/webhook/failed` stays
> empty). In the Developer Console, set **Distribution → Sharing** to make the app
> public — this does NOT require Marketplace/Atlassian approval (installers just see
> an "unapproved app" notice). Without it, `jira` events silently never arrive.

## Prerequisites

- An Atlassian Cloud site (e.g. `your-site.atlassian.net`) with Jira and/or
  Confluence, and access to create a developer app.

---

## 1. Create the OAuth 2.0 (3LO) app

[developer.atlassian.com/console/myapps](https://developer.atlassian.com/console/myapps)
→ **Create** → **OAuth 2.0 integration**. One app serves both skills.

## 2. Add APIs + scopes (Permissions tab)

Add these APIs and enable the **classic** scopes (they match the
`ATLASSIAN_SCOPES_*` vars in `wrangler.jsonc`):

| API                   | Scopes                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Jira API**          | `read:jira-work`, `write:jira-work`, `read:jira-user`, `manage:jira-webhook`                                    |
| **Confluence API**    | `read:confluence-content.all`, `write:confluence-content`, `read:confluence-space.summary`, `search:confluence` |
| **User identity API** | `read:me`                                                                                                       |

`offline_access` (refresh tokens) is **not** in the table above and is not added in
the console — it's a standard OAuth scope, not a per-API permission. It already
ships in the `ATLASSIAN_SCOPES_*` vars in `wrangler.jsonc`, so the skill includes it
in the consent URL automatically (that's what makes Atlassian return a refresh
token). Atlassian recommends classic scopes; keep the total under 50 per app.

## 3. Set the callback URL ⚠️

Authorization settings → **Callback URL**. Atlassian allows exactly **one**, and it
must match _exactly_ (scheme, host, port, path). Set it to the fixed-port loopback
the Cremind backend listens on:

```
http://127.0.0.1:1516/
```

`1516` is the default `CREMIND_OAUTH_CALLBACK_PORT` (the Docker desktop image sets
`OAUTH_CALLBACK_PORT=1516`); the listener serves the root path on `127.0.0.1`. If
you've overridden that env var, register that port instead. The port and trailing
slash must match exactly. This fixed, pre-registered callback is why Atlassian
linking **requires running under `cremind serve`** — there is no ephemeral-port
loopback fallback like the Google skills have. Pin that port before registering.

## 4. Cloudflare — Atlassian secret + vars

In the [developer console](https://developer.atlassian.com/console/myapps) → your
app → **Settings**, copy the **Client ID** and **Secret** (both are generated when
you create the app in §1). The Client ID goes in the `ATLASSIAN_CLIENT_ID` var
below; the Secret goes in the `wrangler secret`:

```bash
npx wrangler secret put ATLASSIAN_CLIENT_SECRET      # CONFIDENTIAL — held server-side only, NEVER served to clients
```

In `wrangler.jsonc` set `ATLASSIAN_CLIENT_ID` (the scope vars
`ATLASSIAN_SCOPES_JIRA` / `ATLASSIAN_SCOPES_CONFLUENCE` ship with sensible
defaults). Then deploy per [SETUP.md → Deploy](SETUP.md#5-deploy).

> Unlike Connect/Forge, 3LO needs **no Marketplace listing or app "distribution"** —
> the consent URL works for any Atlassian user who approves it. (Marketplace /
> per-site installation only matters for the Phase 2 Confluence Forge app.)

---

## 5. Smoke test

1. `curl https://connect.cremind.io/.well-known/cremind-connect` → confirm an
   `atlassian` provider with `jira` + `confluence` resources and your `authClientId`.
2. In a Cremind app (running under `cremind serve`), in the `jira` skill run
   `uv run scripts/__main__.py link`; open the printed consent URL and approve.
3. `uv run scripts/__main__.py status` → `linked: true` with your email + site url.
4. `uv run scripts/__main__.py search --query "assignee = currentUser() ORDER BY updated DESC"`
   → issues returned.
5. Jira events: start `uv run scripts/event_listener.py`, change an issue → expect a
   new file under `events/issue_changed/` (relay nudge → JQL pull).
