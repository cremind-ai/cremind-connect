import { Hash, Lock, RadioTower, RefreshCw, ShieldCheck } from "lucide-react";

import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const steps = [
  {
    n: "01",
    icon: ShieldCheck,
    title: "Verify",
    body: "A provider — Calendar, Drive, or Jira via webhook — pushes a notification to Cremind Connect, which cryptographically verifies it really came from the provider.",
  },
  {
    n: "02",
    icon: Hash,
    title: "Hash",
    body: "It turns the account's email into a one-way hash: a short routing key. The key only decides which connections to notify — the email itself is never stored or logged.",
  },
  {
    n: "03",
    icon: RadioTower,
    title: "Nudge",
    body: "It broadcasts a single content-free message over WebSocket to every app that proved control of that account. No email, calendar, file, or issue data is ever inside it.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">
            How it works
          </Badge>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Two planes. Your tokens never cross into ours.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Cremind Connect separates <em>authorization</em> (getting permission)
            from <em>events</em> (knowing something changed). Your tokens live
            only in the first plane — on your machine.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map(({ n, icon: Icon, title, body }) => (
            <Card key={n} className="relative">
              <CardHeader>
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {n}
                  </span>
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-pretty">{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-base text-muted-foreground text-pretty">
          Your app then re-syncs the actual data itself, using its own token.
        </p>

        <div className="mx-auto mt-10 max-w-md">
          <div className="mb-2 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
            The entire payload it broadcasts
          </div>
          <pre className="overflow-x-auto rounded-xl bg-neutral-950 p-5 text-sm leading-relaxed text-neutral-100 ring-1 ring-white/10">
            <code>{`{
  "type": "resync",
  "source": "calendar",
  "ts": 1717939200
}`}</code>
          </pre>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <Lock className="size-4.5" />
              </span>
              <CardTitle>Authorization stays on your machine</CardTitle>
              <CardDescription className="text-pretty">
                Your local app signs in to Google directly with a loopback PKCE
                flow, and the tokens it receives never leave your machine — for
                Google, Cremind Connect is never in the token path. Atlassian uses
                a confidential flow, so the relay briefly performs the token
                exchange on your behalf, hands the tokens back to your app, and
                discards them — storing nothing.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <RefreshCw className="size-4.5" />
              </span>
              <CardTitle>Missed nudges self-heal</CardTitle>
              <CardDescription className="text-pretty">
                Offline when a nudge fires? Nothing is lost. Your app re-syncs on
                reconnect, because the relay keeps no queue and no state to miss.
                Routing keys are recomputed from each event, and live connections
                are ephemeral.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Container>
    </section>
  );
}
