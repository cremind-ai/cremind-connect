import type { Metadata } from "next";
import { BookOpen, Bug, Mail, ShieldAlert } from "lucide-react";

import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Support",
  description:
    "Get help with Cremind Connect: email support, open a GitHub issue, or report a security problem privately.",
  alternates: { canonical: "/contact" },
};

const channels = [
  {
    icon: Mail,
    title: "Email support",
    body: "For general questions, privacy requests, or anything that isn't a public bug report.",
    href: `mailto:${siteConfig.contactEmail}`,
    label: siteConfig.contactEmail,
    external: false,
  },
  {
    icon: Bug,
    title: "Report a bug or request a feature",
    body: "Open an issue on the cremind-connect repository. Public issues help the whole community.",
    href: siteConfig.links.connectIssues,
    label: "GitHub Issues",
    external: true,
  },
  {
    icon: BookOpen,
    title: "About the Cremind app",
    body: "Questions about the main self-hosted assistant belong on the Cremind project.",
    href: siteConfig.links.cremindRepo,
    label: "github.com/cremind-ai/cremind",
    external: true,
  },
  {
    icon: ShieldAlert,
    title: "Security issues",
    body: "Please report suspected security problems privately by email rather than in a public issue.",
    href: `mailto:${siteConfig.contactEmail}`,
    label: siteConfig.contactEmail,
    external: false,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact & Support"
        description="Cremind Connect is a small, open-source community project. The best way to reach us is through the channels below."
      />
      <Container className="py-14 sm:py-16">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {channels.map(({ icon: Icon, title, body, href, label, external }) => (
            <Card key={title}>
              <CardHeader>
                <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle>{title}</CardTitle>
                <CardDescription className="text-pretty">{body}</CardDescription>
                <a
                  href={href}
                  {...(external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                  className="mt-3 inline-block text-sm font-medium text-foreground underline underline-offset-4"
                >
                  {label}
                </a>
              </CardHeader>
            </Card>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground text-pretty">
          This is a volunteer, best-effort community project with no service-level
          agreement. We read every issue and email, but we can&rsquo;t guarantee a
          response time.
        </p>
      </Container>
    </>
  );
}
