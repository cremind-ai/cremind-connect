import { Container } from "@/components/container";

export function PageHeader({
  title,
  description,
  meta,
}: {
  title: string;
  description?: string;
  meta?: React.ReactNode;
}) {
  return (
    <section className="border-b border-border/60 bg-muted/30">
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              {description}
            </p>
          ) : null}
          {meta ? (
            <p className="mt-4 text-sm text-muted-foreground">{meta}</p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
