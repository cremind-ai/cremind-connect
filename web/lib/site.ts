/**
 * Central site configuration for the Cremind Connect marketing site.
 * Keep all external links, contact details, and legal identifiers here so the
 * pages stay consistent and easy to update.
 */
export const siteConfig = {
  name: "Cremind Connect",
  // Short value-prop used in <title> and hero.
  tagline: "Real-time events for your self-hosted AI assistant",
  description:
    "Cremind Connect delivers real-time Gmail, Calendar, and Jira events to your local Cremind app — without ever storing your OAuth tokens or your data.",
  url: "https://connect.cremind.io",
  host: "connect.cremind.io",

  // Legal operator named in the Privacy Policy and Terms of Service.
  operator: "Cremind (cremind-ai)",
  contactEmail: "admin@cremind.io",
  copyrightYear: 2026,

  links: {
    cremind: "https://cremind.io",
    cremindRepo: "https://github.com/cremind-ai/cremind",
    connectRepo: "https://github.com/cremind-ai/cremind-connect",
    connectIssues: "https://github.com/cremind-ai/cremind-connect/issues",
    // DESIGN.md does not exist in the repo; link the README's two-plane section.
    architecture:
      "https://github.com/cremind-ai/cremind-connect#the-key-idea-two-planes",
  },

  // Primary navigation (logo links home separately).
  nav: [
    { title: "How it works", href: "/#how" },
    { title: "Data access", href: "/#data" },
    { title: "Privacy", href: "/privacy" },
    { title: "Terms", href: "/terms" },
    { title: "Contact", href: "/contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
