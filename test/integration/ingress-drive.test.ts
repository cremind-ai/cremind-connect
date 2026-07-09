import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";
import { makeDriveWebhook } from "../helpers/make-drive-webhook.ts";
import { buildCalendarChannelId } from "../../src/routing/channel-id.ts";

const ABC_KEY = "lihoigfzisd3533cvaluhfd5zq";

describe("drive ingress", () => {
  it("accepts a valid webhook (no live hub -> delivered 0)", async () => {
    const channelId = buildCalendarChannelId(ABC_KEY, "abcdefghij234567");
    const res = await SELF.fetch(makeDriveWebhook({ channelId }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ delivered: 0 });
  });

  it("acks the sync handshake without broadcasting (204)", async () => {
    const channelId = buildCalendarChannelId(ABC_KEY, "abcdefghij234567");
    const res = await SELF.fetch(makeDriveWebhook({ channelId, resourceState: "sync" }));
    expect(res.status).toBe(204);
  });

  it("rejects a foreign channel id (400)", async () => {
    const res = await SELF.fetch(makeDriveWebhook({ channelId: "not-our-channel" }));
    expect(res.status).toBe(400);
  });
});
