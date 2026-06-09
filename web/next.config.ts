import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a fully static site to ./out so the existing cremind-connect Worker
  // can serve it via Cloudflare Workers Static Assets (see ../wrangler.jsonc).
  output: "export",
  // Required for static export: no Image Optimization server is available.
  images: { unoptimized: true },
  // The Worker repo has its own package-lock.json one level up; pin the
  // Turbopack workspace root to this package to silence the inferred-root warning.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
