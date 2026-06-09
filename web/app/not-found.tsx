import Link from "next/link";

import { Container } from "@/components/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground text-pretty">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-6")}>
        Back home
      </Link>
    </Container>
  );
}
