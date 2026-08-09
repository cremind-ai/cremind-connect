import {
  CalendarDays,
  FileSpreadsheet,
  FileText,
  FileType,
  HardDrive,
  Mail,
  SquareKanban,
} from "lucide-react";

import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const providers = [
  {
    icon: Mail,
    name: "Gmail",
    vendor: "Google",
    body: "Send and reply via OAuth; reading and live mailbox events run over IMAP with an app password.",
    status: "Execution-only",
    live: false,
  },
  {
    icon: CalendarDays,
    name: "Google Calendar",
    vendor: "Google",
    body: "Live event changes via webhook.",
    status: "Real-time",
    live: true,
  },
  {
    icon: HardDrive,
    name: "Google Drive",
    vendor: "Google",
    body: "Live file changes via changes.watch webhook, for the files you grant.",
    status: "Real-time",
    live: true,
  },
  {
    icon: FileSpreadsheet,
    name: "Google Sheets",
    vendor: "Google",
    body: "Read/write via OAuth; file events via Drive (granted files).",
    status: "Execution-only",
    live: false,
  },
  {
    icon: FileType,
    name: "Google Docs",
    vendor: "Google",
    body: "Read/write via OAuth; file events via Drive (granted files).",
    status: "Execution-only",
    live: false,
  },
  {
    icon: SquareKanban,
    name: "Jira",
    vendor: "Atlassian",
    body: "Live issue changes via dynamic webhooks.",
    status: "Real-time",
    live: true,
  },
  {
    icon: FileText,
    name: "Confluence",
    vendor: "Atlassian",
    body: "Content access today; real-time events planned.",
    status: "Events coming soon",
    live: false,
  },
];

export function WorksWith() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Plugs into the skills you already use
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Cremind Connect powers Cremind&rsquo;s built-in Agent Skills for
            Google and Atlassian — handling credential discovery, webhook routing,
            and real-time push so the skills work live while your data stays local.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {providers.map(({ icon: Icon, name, vendor, body, status, live }) => (
            <Card key={name}>
              <CardHeader>
                <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle>{name}</CardTitle>
                <CardDescription className="text-pretty">
                  <span className="text-foreground/70">{vendor}</span> · {body}
                </CardDescription>
                <CardAction>
                  <Badge variant={live ? "secondary" : "outline"}>{status}</Badge>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground text-pretty">
          Confluence real-time push isn&rsquo;t available yet for OAuth apps, so the
          Confluence skill works by polling today. Real-time support is planned for
          a future release.
        </p>
      </Container>
    </section>
  );
}
