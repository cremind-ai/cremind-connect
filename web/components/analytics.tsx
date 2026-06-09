import Script from "next/script";

/**
 * Cloudflare Web Analytics — cookieless, privacy-friendly, no personal data.
 * Renders only when NEXT_PUBLIC_CF_ANALYTICS_TOKEN is set at build time, so the
 * site never ships a broken beacon. Alternatively, analytics can be enabled
 * zone-side in the Cloudflare dashboard (automatic injection) with no token here.
 */
export function Analytics() {
  const token = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
  if (!token) return null;

  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
