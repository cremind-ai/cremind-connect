/** Build a Google Drive changes.watch webhook request for POST /ingress/google/drive. */
export function makeDriveWebhook(opts: {
  channelId: string;
  resourceState?: string;
  channelToken?: string;
  messageNumber?: string;
  resourceId?: string;
  origin?: string;
}): Request {
  const origin = opts.origin ?? "https://connect.test";
  const headers = new Headers({
    "x-goog-channel-id": opts.channelId,
    "x-goog-resource-state": opts.resourceState ?? "change",
    "x-goog-message-number": opts.messageNumber ?? "2",
    "x-goog-resource-id": opts.resourceId ?? "resource-1",
  });
  if (opts.channelToken) headers.set("x-goog-channel-token", opts.channelToken);
  // Drive webhooks have an empty body (header-only notification).
  return new Request(`${origin}/ingress/google/drive`, { method: "POST", headers });
}
