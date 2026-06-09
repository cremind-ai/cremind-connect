import { Container } from "@/components/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Does Cremind Connect store my Google or Atlassian tokens?",
    a: "No. For Google it never even sees your tokens — your app authenticates directly with Google. For Atlassian's confidential flow it briefly relays the token exchange in memory and then discards it. Either way, nothing is stored.",
  },
  {
    q: "Can it read my emails, calendar, or issues?",
    a: "No. It only relays a content-free “resync” nudge that says something changed. Your own app then fetches the actual data directly from the provider using its own token.",
  },
  {
    q: "What happens if my app is offline when something changes?",
    a: "Nothing is lost. Your app re-syncs on reconnect. The relay keeps no queue and no per-user state, so there is nothing to miss.",
  },
  {
    q: "Do I have to run any cloud infrastructure?",
    a: "No. You click an OAuth consent screen in your browser. Cremind Connect owns the organization-level infrastructure — the Pub/Sub topic, webhook domain, and OAuth app — on your behalf.",
  },
  {
    q: "Is it free?",
    a: "Yes. Cremind Connect is a free, open-source community service, provided as-is. See the Terms of Service for details.",
  },
];

export function Faq() {
  return (
    <section className="border-t border-border/60 bg-muted/30 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Frequently asked questions
          </h2>
          <Accordion multiple={false} className="mt-10">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}
