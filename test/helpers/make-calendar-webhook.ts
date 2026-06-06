/** Build a Google Calendar webhook request for POST /ingress/google/calendar. */
export function makeCalendarWebhook(opts: {
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
    "x-goog-resource-state": opts.resourceState ?? "exists",
    "x-goog-message-number": opts.messageNumber ?? "2",
    "x-goog-resource-id": opts.resourceId ?? "resource-1",
  });
  if (opts.channelToken) headers.set("x-goog-channel-token", opts.channelToken);
  // Calendar webhooks have an empty body.
  return new Request(`${origin}/ingress/google/calendar`, { method: "POST", headers });
}
