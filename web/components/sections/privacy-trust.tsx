import Link from "next/link";
import { ArrowRight, EyeOff, KeyRound, Server } from "lucide-react";

import { Container } from "@/components/container";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const cards = [
  {
    icon: KeyRound,
    title: "No tokens stored",
    body: "Your OAuth access and refresh tokens stay on your machine. The relay never persists them.",
  },
  {
    icon: EyeOff,
    title: "No content seen",
    body: "Cremind Connect never reads your emails, calendar entries, or issues. It relays a “something changed” nudge — your app fetches the data itself.",
  },
  {
    icon: Server,
    title: "Stateless at rest",
    body: "Routing keys are derived on the fly, connections are ephemeral, and the only cache holds Google's public keys and single-use replay tokens — both auto-expiring.",
  },
];

export function PrivacyTrust() {
  return (
    <section className="border-y border-border/60 bg-muted/30 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            We can&rsquo;t lose what we never hold
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Privacy isn&rsquo;t a policy bolted on afterward — it&rsquo;s the
            architecture. The relay is designed so there is nothing sensitive to
            store, leak, or subpoena.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
          {cards.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardHeader>
                <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-background text-emerald-600 ring-1 ring-border dark:text-emerald-500">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle>{title}</CardTitle>
                <CardDescription className="text-pretty">{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/privacy"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Read the full privacy policy
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
