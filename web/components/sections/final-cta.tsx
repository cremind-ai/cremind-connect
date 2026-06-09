import { ArrowRight } from "lucide-react";

import { Container } from "@/components/container";
import { GithubIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

export function FinalCta() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl border border-border/60 bg-muted/40 px-6 py-14 text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Run your own assistant. Keep your own data.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground text-pretty">
            Cremind is the open, self-hosted personal AI. Cremind Connect is the
            relay that keeps it in sync — privately.
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
              Star on GitHub
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
