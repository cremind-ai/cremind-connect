import type { Metadata } from "next";

import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { Prose } from "@/components/prose";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms for the free, open-source Cremind Connect community relay. Provided as-is, with no warranty and no service-level agreement.",
  alternates: { canonical: "/terms" },
};

const EFFECTIVE_DATE = "June 9, 2026";

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Terms of Service"
        description="The terms that govern use of the Cremind Connect relay and this website."
        meta={
          <>
            Effective {EFFECTIVE_DATE} · Operator: {siteConfig.operator}
          </>
        }
      />
      <Container className="py-14 sm:py-16">
        <Prose className="mx-auto max-w-3xl">
          <h2>1. The service</h2>
          <p>
            Cremind Connect is a free, open-source (MIT-licensed) relay that
            forwards content-free &ldquo;resync&rdquo; notifications to
            self-hosted{" "}
            <a href={siteConfig.links.cremind} target="_blank" rel="noreferrer">
              Cremind
            </a>{" "}
            apps. It is companion infrastructure for the separate Cremind project
            and does not process the contents of your data.
          </p>

          <h2>2. Acceptance</h2>
          <p>
            By using the relay or this website, you agree to these Terms. If you do
            not agree, do not use the service.
          </p>

          <h2>3. Free, community service — no warranty, no SLA</h2>
          <p>
            The service is provided <strong>&ldquo;as is&rdquo;</strong> and{" "}
            <strong>&ldquo;as available,&rdquo;</strong> without warranties of any
            kind, express or implied, including merchantability, fitness for a
            particular purpose, and non-infringement, consistent with the MIT
            License. There is <strong>no uptime guarantee</strong>, no
            service-level agreement, and no support commitment.
          </p>

          <h2>4. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, the authors and operators
            shall not be liable for any claim, damages, or other liability arising
            from or in connection with the use of the service or this website.
          </p>

          <h2>5. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>attempt to overwhelm, disrupt, or degrade the service;</li>
            <li>
              circumvent the service&rsquo;s verification or replay-protection
              mechanisms;
            </li>
            <li>
              impersonate other accounts or attempt to receive notifications for
              accounts you do not control;
            </li>
            <li>reverse-engineer the service in order to attack it; or</li>
            <li>use the service for any unlawful purpose.</li>
          </ul>
          <p>We may rate-limit or block traffic that we consider abusive.</p>

          <h2>6. Your responsibilities</h2>
          <p>
            You are responsible for your own credentials, tokens, and data, and for
            complying with Google&rsquo;s, Atlassian&rsquo;s, and any other
            applicable terms and laws. The relay never holds your tokens or
            content; safeguarding what is on your own machine is your
            responsibility.
          </p>

          <h2>7. A relay, not a processor of your content</h2>
          <p>
            Cremind Connect does not process the contents of your email, calendar,
            or issues. It verifies provider pushes and broadcasts content-free
            nudges; your app retrieves any actual data itself.
          </p>

          <h2>8. Third-party services</h2>
          <p>
            Your use of Google and Atlassian is governed by their respective terms.
            Cremind Connect is an independent project and is not endorsed by, or
            affiliated with, Google or Atlassian.
          </p>

          <h2>9. Changes and availability</h2>
          <p>
            Given its free and community nature, we may modify, suspend, or
            discontinue the service or these Terms at any time, without liability.
            Material changes will be reflected by a new effective date here.
          </p>

          <h2>10. Termination</h2>
          <p>
            You may stop using the service at any time by unlinking the integration
            and revoking your OAuth grants. We may terminate or restrict access for
            abuse or in order to retire the service.
          </p>

          <h2>11. Open source</h2>
          <p>
            The software is licensed under the MIT License, which governs the code
            itself and accompanies the public{" "}
            <a
              href={siteConfig.links.connectRepo}
              target="_blank"
              rel="noreferrer"
            >
              repository
            </a>
            .
          </p>

          <h2>12. Governing law</h2>
          <p>
            These Terms are governed by the laws of{" "}
            <strong>[jurisdiction to be confirmed before publication]</strong>,
            without regard to conflict-of-laws principles.
          </p>

          <h2>13. Contact</h2>
          <p>
            Questions about these Terms? Email{" "}
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
