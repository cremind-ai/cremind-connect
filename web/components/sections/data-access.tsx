import {
  AtSign,
  CalendarDays,
  FileText,
  HardDrive,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/container";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// The Google data the Cremind app requests through the OAuth consent screen.
// IMPORTANT: this is a public disclosure — it must list exactly the scopes the
// live consent screen requests, no more and no less. Claiming access the app does
// not have is a verification and legal problem, so keep this list, the parallel
// scope section in /privacy, and the GOOGLE_SCOPES_* vars in wrangler.jsonc in
// lockstep. Every scope here is sensitive; none is restricted.
const scopes = [
  {
    icon: AtSign,
    name: "Email address & sign-in",
    scope: "openid · userinfo.email",
    body: "Identifies the account you linked and derives the one-way routing key that delivers real-time events to your session. Your email is never stored by Cremind Connect.",
  },
  {
    icon: Mail,
    name: "Gmail — send only",
    scope: "gmail.send",
    body: "Sends the emails and replies you compose or approve. It cannot read your mailbox: this scope grants no access to your messages, drafts, labels, or search.",
  },
  {
    icon: CalendarDays,
    name: "Calendar events",
    scope: "calendar.events",
    body: "Create, view, update, and delete your own calendar events for the scheduling features you enable.",
  },
  {
    icon: HardDrive,
    name: "Drive — per file",
    scope: "drive.file",
    body: "Reaches only individual files you hand it: the ones you choose in Google's own file picker, plus files Cremind creates for you. The rest of your Drive stays invisible to it.",
  },
  {
    icon: FileText,
    name: "Docs & Sheets",
    scope: "documents · spreadsheets",
    body: "Create and read/edit the Google Docs and Sheets you name, so Cremind can work with your existing content.",
  },
];

export function DataAccess() {
  return (
    <section id="data" className="scroll-mt-20 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            The Google data Cremind asks for — and why
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            When you connect a Google account, Cremind requests only the scopes
            needed for the features you enable. Here is every piece of Google data
            it asks for, and the reason.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {scopes.map(({ icon: Icon, name, scope, body }) => (
            <Card key={scope}>
              <CardHeader>
                <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle>{name}</CardTitle>
                <CardDescription className="text-pretty">
                  <code className="text-xs text-foreground/70">{scope}</code>
                  <span className="mt-2 block">{body}</span>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-border/60 bg-muted/30 p-6">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
            <p className="text-sm text-muted-foreground text-pretty">
              Cremind runs on your own machine. When you connect Google, sign-in
              happens directly between your device and Google (loopback + PKCE);
              your access and refresh tokens are stored only on your machine, and
              Cremind Connect is never in the token path. Cremind&rsquo;s use of
              information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. See our{" "}
              <Link
                href="/privacy"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
