import { ArrowRight, Check } from "lucide-react";

import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { GithubIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

const trust = ["Token-less", "Stateless at rest", "MIT licensed", "Open & auditable"];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_50%_0%,var(--muted)_0%,transparent_70%)]" />
      <Container className="py-20 text-center sm:py-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <Badge variant="outline" className="mb-5">
            Open source · Part of the Cremind project
          </Badge>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Real-time events for your self-hosted AI — without handing over your
            keys.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            {siteConfig.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={siteConfig.links.cremind}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Get Cremind
              <ArrowRight className="size-4" />
            </a>
            <a
              href={siteConfig.links.connectRepo}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              <GithubIcon className="size-4" />
              View source
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {trust.map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
