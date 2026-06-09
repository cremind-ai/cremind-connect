import { Container } from "@/components/container";
import { siteConfig } from "@/lib/site";

export function WhatIs() {
  return (
    <section id="what" className="scroll-mt-20 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            The connective tissue between your assistant and the cloud
          </h2>
          <div className="mt-6 space-y-4 text-lg text-muted-foreground text-pretty">
            <p>
              <a
                href={siteConfig.links.cremind}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Cremind
              </a>{" "}
              is an open-source, self-hosted personal AI assistant that runs on
              your own machine. Cremind Connect is its companion relay: it owns
              the small amount of cloud infrastructure that Google and Atlassian
              require for real-time push, so your local assistant can react to new
              email, calendar changes, and Jira updates the moment they happen.
            </p>
            <p>
              It is the backend that powers Cremind&rsquo;s Google and Atlassian{" "}
              <strong className="font-medium text-foreground">Agent Skills</strong>{" "}
              — and it is built so that infrastructure never holds your data.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
