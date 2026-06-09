import type { Metadata } from "next";

import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { Prose } from "@/components/prose";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Cremind Connect handles data: no OAuth tokens stored, no email, calendar, or issue content processed — only content-free resync nudges, routed by a one-way hash.",
  alternates: { canonical: "/privacy" },
};

const EFFECTIVE_DATE = "June 9, 2026";

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        description="How Cremind Connect handles data — and how little of it there is."
        meta={
          <>
            Effective {EFFECTIVE_DATE} · Operator: {siteConfig.operator}
          </>
        }
      />
      <Container className="py-14 sm:py-16">
        <Prose className="mx-auto max-w-3xl">
          <p>
            This policy explains what data the Cremind Connect service and this
            website do and do not handle. Cremind Connect is a token-less OAuth
            broker and event relay for the open-source{" "}
            <a href={siteConfig.links.cremind} target="_blank" rel="noreferrer">
              Cremind
            </a>{" "}
            assistant. Its source code is{" "}
            <a
              href={siteConfig.links.connectRepo}
              target="_blank"
              rel="noreferrer"
            >
              public
            </a>{" "}
            and can be audited at any time.
          </p>

          <h2>1. Scope</h2>
          <p>
            This policy covers two distinct things, described separately below:
            (a) the <strong>Cremind Connect relay service</strong> at{" "}
            <code>connect.cremind.io</code>, and (b) this{" "}
            <strong>marketing website</strong>.
          </p>

          <h2>2. The relay service — what it does not do</h2>
          <ul>
            <li>
              It does <strong>not</strong> store your OAuth access or refresh
              tokens.
            </li>
            <li>
              It does <strong>not</strong> read, receive, store, or process the{" "}
              <em>contents</em> of your email, calendar, or Jira/Confluence items.
            </li>
            <li>
              It does <strong>not</strong> maintain user accounts, profiles, or a
              database of users.
            </li>
          </ul>

          <h2>3. The relay service — what it does handle</h2>
          <ul>
            <li>
              <strong>Verifying provider push notifications.</strong> When Google
              or Atlassian sends a push, the relay cryptographically verifies that
              it genuinely came from the provider.
            </li>
            <li>
              <strong>Deriving a routing key.</strong> It computes a one-way hash
              of the account email to decide which live connections to notify. The
              email is used only transiently to compute this hash; it is{" "}
              <strong>never stored or logged</strong>. Only the resulting hash is
              used, and it may appear in operational logs.
            </li>
            <li>
              <strong>Broadcasting content-free nudges.</strong> It sends a{" "}
              <code>{`{ "type": "resync" }`}</code> message over WebSocket. This
              message contains <strong>no</strong> provider data. Your own app then
              fetches the actual data directly from the provider using its own
              token.
            </li>
            <li>
              <strong>Atlassian token exchange (transient).</strong> Because
              Atlassian uses a confidential OAuth flow, the relay performs the
              authorization-code and refresh-token exchange on your behalf and
              verifies your account by calling Atlassian&rsquo;s identity endpoint.
              During this exchange your tokens pass through the service in memory
              and are returned to your app; they are{" "}
              <strong>not stored, logged, or retained</strong>. For Google, the
              relay is never in the token path at all.
            </li>
          </ul>

          <h2>4. Data at rest</h2>
          <p>
            The service is stateless at rest. The only persisted data is in a
            temporary key-value cache holding (i) Google&rsquo;s{" "}
            <strong>public</strong> signing certificates and (ii){" "}
            <strong>single-use nonce markers</strong> used to prevent replay
            attacks. Both auto-expire and contain no personal data. WebSocket
            connections are ephemeral and hold no durable state.
          </p>

          <h2>5. Logs</h2>
          <p>
            Operational logs are deliberately scrubbed: email addresses, mailbox
            cursors, and all tokens are <strong>never</strong> logged. Only a
            non-reversible routing-key hash and coarse event metadata are recorded
            for reliability. The service runs on Cloudflare Workers, and Cloudflare
            may process standard network and request metadata (such as IP
            addresses) as our infrastructure provider, subject to{" "}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noreferrer"
            >
              Cloudflare&rsquo;s own privacy terms
            </a>
            .
          </p>

          <h2>6. This website</h2>
          <p>
            This site is a static informational site. It uses{" "}
            <strong>Cloudflare Web Analytics</strong>, which is cookieless,
            collects no personal data, and performs no cross-site tracking. The
            site sets no advertising or tracking cookies of its own. Standard
            server and CDN access logs may be retained by our hosting provider,
            Cloudflare.
          </p>

          <h2>7. Third parties</h2>
          <p>
            The relay interacts with Google and Atlassian solely to verify pushes
            and (for Atlassian) exchange tokens. It shares no data with any other
            third party and does not sell data.
          </p>

          <h2>8. Children</h2>
          <p>
            Cremind Connect is not directed to children under 13, and we do not
            knowingly collect personal information from them.
          </p>

          <h2>9. Your choices</h2>
          <p>
            The service holds no account or stored personal data to access,
            export, or delete. To stop using it, unlink the integration in your
            local Cremind app and revoke the OAuth grant in your Google or
            Atlassian account settings.
          </p>

          <h2>10. Changes</h2>
          <p>
            We may update this policy. Material changes will be reflected by a new
            effective date on this page and in the public repository.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions about this policy? Email{" "}
            <a href={`mailto:${siteConfig.contactEmail}`}>
              {siteConfig.contactEmail}
            </a>{" "}
            or see our <a href="/contact">contact page</a>.
          </p>
        </Prose>
      </Container>
    </>
  );
}
