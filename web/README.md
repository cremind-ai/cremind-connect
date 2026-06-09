# Cremind Connect — marketing site

Static marketing + legal site for **[connect.cremind.io](https://connect.cremind.io)**,
built with Next.js (App Router, static export) and shadcn/ui.

It is served by the `cremind-connect` Cloudflare Worker via **Workers Static
Assets**: `next build` emits `out/`, and the Worker (see `../wrangler.jsonc`)
serves it while its API/WebSocket routes continue to run. The API/WS routes are
listed under `assets.run_worker_first` so they always reach the Worker and are
never shadowed by a static asset.

## Develop

```bash
npm install
npm run dev     # Next dev server at http://localhost:3000
npm run build   # static export to ./out
```

To preview the unified Worker + site locally, from the **repo root** run
`npm run web:build` then `wrangler dev` (serves `out/` and the Worker on :8787).

## Structure

- Pages: `/` (homepage), `/contact`, `/privacy`, `/terms`.
- Shared config (links, contact email, operator name): `lib/site.ts`.
- Homepage sections: `components/sections/`. Header/footer: `components/`.
- UI primitives (shadcn, base-nova style on Base UI): `components/ui/`.

## Analytics

Cloudflare Web Analytics is cookieless and renders only when
`NEXT_PUBLIC_CF_ANALYTICS_TOKEN` is set at build time (see `components/analytics.tsx`).
Alternatively, enable it zone-side in the Cloudflare dashboard (automatic injection)
and leave the env var unset.

## Before publishing

- Set the Cloudflare Web Analytics token (or enable zone-side injection).
- Fill in the governing-law jurisdiction in `app/terms/page.tsx` (section 12).
