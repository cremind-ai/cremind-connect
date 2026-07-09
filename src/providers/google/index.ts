import type { Config } from "../../config.ts";
import type { Provider, ProviderDiscovery } from "../types.ts";

/**
 * Static metadata for the Google provider, used to build the discovery document
 * that lets a cremind skill self-configure (which client id, scopes, Pub/Sub
 * topic and webhook URLs to use).
 *
 * Sheets and Docs are poll-only (Google has no push API for their content), so
 * they register scopes but NO ingress — file-level changes to those documents
 * surface via the Drive resource's changes.watch feed.
 */
export class GoogleProvider implements Provider {
  readonly id = "google" as const;

  describe(config: Config): ProviderDiscovery {
    return {
      provider: "google",
      authClientId: config.google.clientId,
      resources: [
        {
          resource: "gmail",
          scopes: config.google.resourceScopes.gmail ?? [],
          pubsubTopic: config.google.gmailPubsubTopic,
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
