import type { Config } from "../../config.ts";
import type { Provider, ProviderDiscovery } from "../types.ts";

/**
 * Static metadata for the Google provider, used to build the discovery document
 * that lets a cremind skill self-configure (which client id, scopes and webhook
 * URLs to use).
 *
 * Gmail is execution-only (`gmail.send`): the shared OAuth client requests no
 * restricted scope, so it can neither read a mailbox nor call users.watch(). Email
 * reading and live mailbox events run over IMAP inside the app instead, which is
 * why gmail carries scopes but no ingress of any kind.
 *
 * Sheets and Docs are poll-only (Google has no push API for their content), so
 * they register scopes but NO ingress — file-level changes to those documents
 * surface via the Drive resource's changes.watch feed, which under `drive.file`
 * reports only the files the user granted.
 */
export class GoogleProvider implements Provider {
  readonly id = "google" as const;

  describe(config: Config): ProviderDiscovery {
    return {
      provider: "google",
      authClientId: config.google.clientId,
      resources: [
        // gmail stays a discovery resource so new links keep self-configuring their
        // send scope, and so an already-installed mailbox listener — which reads a
        // Pub/Sub topic out of this entry and throws when it is absent — fails fast
        // and clean instead of grinding 403s against users.watch().
        {
          resource: "gmail",
          scopes: config.google.resourceScopes.gmail ?? [],
        },
        {
          resource: "calendar",
          scopes: config.google.resourceScopes.calendar ?? [],
          webhookUrl: `${config.publicBaseUrl}/ingress/google/calendar`,
        },
        {
          resource: "drive",
          scopes: config.google.resourceScopes.drive ?? [],
          webhookUrl: `${config.publicBaseUrl}/ingress/google/drive`,
        },
        {
          resource: "sheets",
          scopes: config.google.resourceScopes.sheets ?? [],
        },
        {
          resource: "docs",
          scopes: config.google.resourceScopes.docs ?? [],
        },
      ],
    };
  }
}
