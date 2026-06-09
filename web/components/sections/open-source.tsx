import { ArrowRight } from "lucide-react";

import { Container } from "@/components/container";
import { GithubIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

export function OpenSource() {
  return (
    <section id="open-source" className="scroll-mt-20 py-20 sm:py-24">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Don&rsquo;t trust us — read the code
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Cremind Connect is MIT-licensed and fully public. The entire relay —
            and the Terraform that provisions its cloud infrastructure — lives in
            one small repository, so anyone can verify exactly what it does (relay
            notifications) and what it doesn&rsquo;t (hold your data).
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={siteConfig.links.connectRepo}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              <GithubIcon className="size-4" />
              Browse the repository
            </a>
            <a
              href={siteConfig.links.architecture}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Read the architecture
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
