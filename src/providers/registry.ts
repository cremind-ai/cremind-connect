import type { IngressAdapter, Provider } from "./types.ts";
import { GoogleProvider } from "./google/index.ts";
import { GooglePubSubIngress } from "./google/pubsub-ingress.ts";
import { GoogleWebhookIngress } from "./google/webhook-ingress.ts";
import { GoogleDriveIngress } from "./google/drive-ingress.ts";
import { AtlassianProvider } from "./atlassian/index.ts";
import { JiraWebhookIngress } from "./atlassian/jira-ingress.ts";

/**
 * Provider + ingress registries. Adding a provider later (GitHub, Microsoft, ...)
 * means registering a new Provider here and one or more IngressAdapters — no
 * changes to routes or the Durable Object.
 */
const PROVIDERS: Provider[] = [new GoogleProvider(), new AtlassianProvider()];

const INGRESS: Record<string, IngressAdapter> = {
  "google/pubsub": new GooglePubSubIngress(),
  "google/calendar": new GoogleWebhookIngress(),
  "google/drive": new GoogleDriveIngress(),
  "atlassian/jira": new JiraWebhookIngress(),
};

export function allProviders(): Provider[] {
  return PROVIDERS;
}

/** Look up an ingress adapter by `provider/mechanism` path, or null if unknown. */
export function ingressFor(provider: string, mechanism: string): IngressAdapter | null {
  return INGRESS[`${provider}/${mechanism}`] ?? null;
}
