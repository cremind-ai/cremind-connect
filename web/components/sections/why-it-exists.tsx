import { Globe, ShieldCheck } from "lucide-react";

import { Container } from "@/components/container";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pieces = [
  {
    icon: Globe,
    title: "A verified webhook domain",
    body: "Google Calendar and Drive only deliver change notifications — even for the individual files you grant — to a verified HTTPS domain, not something an individual registers ad hoc.",
  },
  {
    icon: ShieldCheck,
    title: "A reviewed OAuth consent screen",
    body: "Connecting to Google and Atlassian requires a registered, reviewed OAuth app and consent screen.",
  },
];

export function WhyItExists() {
  return (
    <section className="border-y border-border/60 bg-muted/30 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Real-time push needs infrastructure one person can&rsquo;t run alone
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Getting live notifications from Google or Atlassian requires
            organization-level pieces an individual can&rsquo;t self-provision.
            Cremind Connect owns exactly those shared pieces — and nothing else.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 md:grid-cols-2">
          {pieces.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardHeader>
                <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle>{title}</CardTitle>
                <CardDescription className="text-pretty">{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
