import type { Metadata } from "next";

import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { Prose } from "@/components/prose";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Cremind handles data: the Google account data the app requests and why, and how the Cremind Connect relay stores no OAuth tokens and processes no email, calendar, file, or issue content — only content-free resync nudges, routed by a one-way hash.",
  alternates: { canonical: "/privacy" },
};

const EFFECTIVE_DATE = "July 10, 2026";

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        description="What Google data the Cremind app requests — and how little the relay handles."
        meta={
          <>
            Effective {EFFECTIVE_DATE} · Operator: {siteConfig.operator}
          </>
        }
      />
      <Container className="py-14 sm:py-16">
        <Prose className="mx-auto max-w-3xl">
          <p>
            This policy explains what data the Cremind app, the Cremind Connect
            service, and this website do and do not handle. Cremind is an
            open-source, self-hosted assistant that runs on your own machine;
            Cremind Connect is its token-less OAuth broker and event relay. Both
            are{" "}
            <a
              href={siteConfig.links.connectRepo}
              target="_blank"
              rel="noreferrer"
            >
              open source
            </a>{" "}
            and can be audited at any time. Learn more about{" "}
            <a href={siteConfig.links.cremind} target="_blank" rel="noreferrer">
              Cremind
            </a>
            .
          </p>

          <h2>1. Scope</h2>
          <p>
            This policy covers three distinct things, described separately below:
            (a) the <strong>Google account data the Cremind app requests</strong>{" "}
            through OAuth, (b) the{" "}
            <strong>Cremind Connect relay service</strong> at{" "}
            <code>connect.cremind.io</code>, and (c) this{" "}
            <strong>marketing website</strong>.
          </p>

          <h2>2. The Cremind app — Google account data it requests</h2>
          <p>
            Cremind runs on your own machine. When you connect a Google account,
            the app requests these OAuth scopes:
          </p>
          <ul>
            <li>
              <code>userinfo.profile</code> — your{" "}
              <strong>basic profile</strong> (name, profile picture). Used to
              confirm which Google account you connected and to label that account
              inside the app.
            </li>
            <li>
              <code>openid</code>, <code>userinfo.email</code> — your{" "}
              <strong>email and sign-in identity</strong>. Used to identify the
              account you linked and to derive the one-way routing key that
              delivers content-free real-time event nudges to your session.
            </li>
          </ul>
          <p>
            To provide the features you enable, the app also requests scopes for
            the Google Workspace services you use — each accessed only on your own
            device, at your request or through automations you configure:
          </p>
          <ul>
            <li>
              <strong>Gmail</strong> (<code>gmail.readonly</code>,{" "}
              <code>gmail.send</code>) — read and search your messages, and send
              the emails and replies you compose or approve.
            </li>
            <li>
              <strong>Calendar</strong> (<code>calendar.events</code>) — create,
              view, update, and delete your own calendar events.
            </li>
            <li>
              <strong>Drive</strong> (<code>drive</code>) — search, read/download,
              upload, and organize (move, rename, folder, trash/restore) your
              files.
            </li>
            <li>
              <strong>Docs &amp; Sheets</strong> (<code>documents</code>,{" "}
              <code>spreadsheets</code>) — create and read/edit the documents and
              spreadsheets you name.
            </li>
          </ul>
          <p>
            Sign-in uses a loopback + PKCE flow directly between your device and
            Google. Your access and refresh tokens are stored{" "}
            <strong>only on your own machine</strong>; for Google, Cremind Connect
            is never in the token path.
          </p>
          <p>
            <strong>Limited Use.</strong> Cremind&rsquo;s use of information
            received from Google APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noreferrer"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. Specifically, this data is
            used only to provide the features you enable; it is{" "}
            <strong>not</strong> transferred to others except as necessary to
            provide those features, to comply with applicable law, or as part of a
            merger or acquisition; it is <strong>not</strong> used for advertising;
            and no humans read it except with your consent, for security purposes,
            or to comply with applicable law.
          </p>

          <h2>3. How we protect your data</h2>
          <p>
            Because Cremind is self-hosted and the relay is token-less, the most
            important protection is architectural: your Google data stays on your
            own machine and is never stored on Cremind&rsquo;s servers. In
            addition, we apply the following data-protection measures:
          </p>
          <ul>
            <li>
              <strong>Encryption in transit.</strong> All communication with
              Google&rsquo;s APIs and with the Cremind Connect relay is encrypted
              using TLS (HTTPS and secure WebSockets); your data and tokens are
              never sent over plaintext connections.
            </li>
            <li>
              <strong>On-device storage &amp; access control.</strong> Your OAuth
              tokens and any Google content the app fetches are stored only on
              your own device, under your operating-system user account and its
              file permissions. They are not uploaded to, or accessible by,
              Cremind.
            </li>
            <li>
              <strong>Data minimization.</strong> The Cremind Connect relay stores
              no OAuth tokens and none of the contents of your email, calendar,
              Drive files, or documents — only transient, content-free resync
              nudges routed by a one-way hash (see the relay sections below). This
              sharply limits what could ever be exposed.
            </li>
            <li>
              <strong>Encrypted backups.</strong> If you export a Cremind backup,
              you can protect it with a passphrase; encrypted archives use
              AES-256-GCM with a key derived via scrypt, so the tokens and other
              secrets inside are unreadable without your passphrase.
            </li>
            <li>
              <strong>Secret management &amp; scrubbed logs.</strong> Server-side
              secrets (such as the relay&rsquo;s signing keys) are held as managed
              platform secrets and are never committed to source control.
              Operational logs are scrubbed of email addresses and tokens (see
              &ldquo;Logs&rdquo; below).
            </li>
            <li>
              <strong>Revocation &amp; deletion.</strong> You can disconnect a
              Google account in the app at any time, which deletes the stored
              tokens from your machine, and revoke Cremind&rsquo;s access entirely
              at{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noreferrer"
              >
                myaccount.google.com/permissions
              </a>
              .
            </li>
          </ul>

          <h2>4. The relay service — what it does not do</h2>
          <ul>
            <li>
              It does <strong>not</strong> store your OAuth access or refresh
              tokens.
            </li>
            <li>
              It does <strong>not</strong> read, receive, store, or process the{" "}
              <em>contents</em> of your email, calendar, Drive files, or
              Jira/Confluence items.
            </li>
            <li>
              It does <strong>not</strong> maintain user accounts, profiles, or a
              database of users.
            </li>
          </ul>

          <h2>5. The relay service — what it does handle</h2>
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

          <h2>6. Data at rest</h2>
          <p>
            The service is stateless at rest. The only persisted data is in a
            temporary key-value cache holding (i) Google&rsquo;s{" "}
            <strong>public</strong> signing certificates and (ii){" "}
            <strong>single-use nonce markers</strong> used to prevent replay
            attacks. Both auto-expire and contain no personal data. WebSocket
            connections are ephemeral and hold no durable state.
          </p>

          <h2>7. Logs</h2>
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

          <h2>8. This website</h2>
          <p>
            This site is a static informational site. It uses{" "}
            <strong>Cloudflare Web Analytics</strong>, which is cookieless,
            collects no personal data, and performs no cross-site tracking. The
            site sets no advertising or tracking cookies of its own. Standard
            server and CDN access logs may be retained by our hosting provider,
            Cloudflare.
          </p>

          <h2>9. Third parties</h2>
          <p>
            The relay interacts with Google and Atlassian solely to verify pushes
            and (for Atlassian) exchange tokens. It shares no data with any other
            third party and does not sell data.
          </p>

          <h2>10. Children</h2>
          <p>
            Cremind Connect is not directed to children under 13, and we do not
            knowingly collect personal information from them.
          </p>

          <h2>11. Your choices</h2>
          <p>
            The service holds no account or stored personal data to access,
            export, or delete. To stop using it, unlink the integration in your
            local Cremind app and revoke the OAuth grant in your Google or
            Atlassian account settings.
          </p>

          <h2>12. Changes</h2>
          <p>
            We may update this policy. Material changes will be reflected by a new
            effective date on this page and in the public repository.
          </p>

          <h2>13. Contact</h2>
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
