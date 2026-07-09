import type { IngressAdapter, IngressContext, IngressRequest, Notification } from "../types.ts";
import { parseCalendarChannelId } from "../../routing/channel-id.ts";
import { hmacSha256Hex, timingSafeEqual } from "../../auth/jwt.ts";
import { badRequest, forbidden } from "../../lib/errors.ts";

/**
 * Google Drive -> webhook ingress.
 *
 * Drive changes.watch uses the same push-notification channels mechanism as
 * Calendar: header-only, unsigned notifications whose only routing signal is the
 * channel id (which embeds the routing key). We reuse the shared channel-id
 * parser and the same optional HMAC channel-token check (CALENDAR_REQUIRE_HMAC).
 * A forged webhook is low-impact: it can at most trigger a redundant, authorized
 * re-sync on the client (which always pulls changes with its own token).
 */
export class GoogleDriveIngress implements IngressAdapter {
  readonly id = "google/drive";

  async handle(req: IngressRequest, ctx: IngressContext): Promise<Notification | null> {
    const channelId = req.header("x-goog-channel-id");
    if (!channelId) throw badRequest("missing_channel_id");

    const parsed = parseCalendarChannelId(channelId);
    if (!parsed) throw badRequest("bad_channel_id");

    // Optional verifiable authenticity — shares the Calendar HMAC knob.
    if (ctx.config.calendar.requireHmac) {
      const key = ctx.config.calendar.hmacKey;
      const token = req.header("x-goog-channel-token");
      if (!key) throw forbidden("hmac_not_configured");
      if (!token) throw forbidden("missing_channel_token");
      const expected = await hmacSha256Hex(key, channelId);
      if (!timingSafeEqual(token, expected)) throw forbidden("bad_channel_token");
    }

    const resourceState = req.header("x-goog-resource-state");
    // The first message after watch() is a handshake; ack but don't broadcast.
    if (resourceState === "sync") return null;

    const messageNumber = req.header("x-goog-message-number");

    return {
      accountKey: parsed.routingKey,
      provider: "google",
      resource: "drive",
      cursorHint: {
        ...(resourceState ? { resourceState } : {}),
        ...(messageNumber ? { messageNumber } : {}),
      },
    };
  }
}
