import type {
  IngressAdapter,
  IngressContext,
  IngressRequest,
  Notification,
} from "../types.ts";
import { verifyAtlassianWebhook } from "../../auth/verify-atlassian-webhook.ts";
import { badRequest, forbidden, unauthorized } from "../../lib/errors.ts";

/** base32 routing key (lowercase RFC 4648, 26 chars from a 16-byte slice). */
const ROUTING_KEY_RE = /^[a-z2-7]{26}$/;

/**
 * Jira Cloud -> dynamic webhook ingress (OAuth 2.0 / 3LO).
 *
 * The skill's listener registers a dynamic webhook whose url is
 * `${publicBaseUrl}/ingress/atlassian/jira?rk=<routingKey>`, so — exactly like the
 * Calendar channel-id trick — the routing key travels in the url and the relay
 * needs no stored mapping. Authenticity comes from the bearer JWT Atlassian signs
 * with the app's client secret; a forged call can at most trigger a redundant,
 * authorized resync on the client (which always pulls changes with its own token).
 */
export class JiraWebhookIngress implements IngressAdapter {
  readonly id = "atlassian/jira";

  async handle(
    req: IngressRequest,
    ctx: IngressContext,
  ): Promise<Notification | null> {
    const secret = ctx.config.atlassian.clientSecret;
    if (!secret) throw forbidden("atlassian_not_configured");

    const authz = req.header("authorization");
    if (!authz || !authz.toLowerCase().startsWith("bearer "))
      throw unauthorized("missing_bearer");
    const token = authz.slice(authz.indexOf(" ") + 1).trim();

    const payload = await verifyAtlassianWebhook(token, secret, ctx.now());
    if (!payload) throw unauthorized("bad_webhook_jwt");

    const rk = req.query("rk");
    if (!rk || !ROUTING_KEY_RE.test(rk)) throw badRequest("missing_or_bad_rk");

    return { accountKey: rk, provider: "atlassian", resource: "jira" };
  }
}
