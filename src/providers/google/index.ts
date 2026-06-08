import type { Config } from "../../config.ts";
import type { Provider, ProviderDiscovery } from "../types.ts";

/**
 * Static metadata for the Google provider, used to build the discovery document
 * that lets a cremind skill self-configure (which client id, scopes, Pub/Sub
 * topic and Calendar webhook URL to use).
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
      ],
    };
  }
}
