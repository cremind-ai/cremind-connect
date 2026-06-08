import type { Config } from "../../config.ts";
import type { Provider, ProviderDiscovery } from "../types.ts";

/**
 * Static metadata for the Atlassian provider (Jira + Confluence), used to build
 * the discovery document so the jira / confluence skills self-configure: which
 * OAuth client id and per-resource scopes to request, and (Jira) which webhook
 * url to register dynamic webhooks against.
 *
 * Unlike Google, the Atlassian client SECRET is confidential and is NOT exposed
 * here or at /credentials — the backend holds it and mediates the token exchange.
 */
export class AtlassianProvider implements Provider {
  readonly id = "atlassian" as const;

  describe(config: Config): ProviderDiscovery {
    return {
      provider: "atlassian",
      authClientId: config.atlassian.clientId,
      resources: [
        {
          resource: "jira",
          scopes: config.atlassian.resourceScopes.jira ?? [],
          // The skill registers Jira dynamic webhooks pointing here (+ ?rk=<routingKey>).
          webhookUrl: `${config.publicBaseUrl}/ingress/atlassian/jira`,
        },
        {
          resource: "confluence",
          scopes: config.atlassian.resourceScopes.confluence ?? [],
          // Phase 1: Confluence has no 3LO webhook path; change detection is polling
          // on the client. A webhookUrl is added in Phase 2 (Forge Remote).
        },
      ],
    };
  }
}
