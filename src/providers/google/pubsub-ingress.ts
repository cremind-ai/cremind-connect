import type { IngressAdapter, IngressContext, IngressRequest, Notification } from "../types.ts";
import { verifyPubSubPushToken } from "../../auth/verify-pubsub-oidc.ts";
import { accountKeyFor } from "../../routing/account-key.ts";
import { base64UrlDecodeToString } from "../../auth/jwt.ts";
import { badRequest, unauthorized } from "../../lib/errors.ts";

/** Shape of a Gmail watch notification (base64 in the Pub/Sub message data). */
interface GmailPushData {
  emailAddress?: string;
  historyId?: string | number;
}

interface PubSubEnvelope {
  message?: { data?: string; messageId?: string; message_id?: string };
}

/**
 * Gmail -> Pub/Sub -> push ingress.
 *
 * Authenticates the request via the Google OIDC JWT in the Authorization header,
 * decodes the {emailAddress, historyId} payload, and derives the routing key from
 * the email. The raw email is used only to compute the key and is never stored or
 * logged.
 */
export class GooglePubSubIngress implements IngressAdapter {
  readonly id = "google/pubsub";

  async handle(req: IngressRequest, ctx: IngressContext): Promise<Notification | null> {
    const authz = req.header("authorization");
    if (!authz || !authz.toLowerCase().startsWith("bearer ")) {
      throw unauthorized("missing_bearer");
    }
    const token = authz.slice(authz.indexOf(" ") + 1).trim();

    await verifyPubSubPushToken(token, {
      resolve: ctx.resolveKey,
      audience: ctx.config.google.pubsubAudience,
      serviceAccountEmail: ctx.config.google.pubsubServiceAccount,
      now: ctx.now(),
    });

    let envelope: PubSubEnvelope;
    try {
      envelope = (await req.json()) as PubSubEnvelope;
    } catch {
      throw badRequest("bad_envelope");
    }
    const dataB64 = envelope.message?.data;
    if (!dataB64) throw badRequest("missing_data");

    let data: GmailPushData;
    try {
      data = JSON.parse(base64UrlDecodeToString(dataB64)) as GmailPushData;
    } catch {
      throw badRequest("bad_data");
    }
    const email = data.emailAddress;
    if (!email) throw badRequest("missing_email_address");

    const accountKey = await accountKeyFor("google", email);
    const cursorHint =
      data.historyId !== undefined ? { historyId: String(data.historyId) } : undefined;

    return {
      accountKey,
      provider: "google",
      resource: "gmail",
      ...(cursorHint ? { cursorHint } : {}),
    };
  }
}
