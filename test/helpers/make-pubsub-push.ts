/** Build a Gmail Pub/Sub push request for POST /ingress/google/pubsub. */
export function makePubSubPush(opts: {
  token: string;
  emailAddress: string;
  historyId?: string | number;
  origin?: string;
}): Request {
  const origin = opts.origin ?? "https://connect.test";
  const data = btoa(
    JSON.stringify({ emailAddress: opts.emailAddress, historyId: opts.historyId ?? "1" }),
  );
  const body = JSON.stringify({
    message: { data, messageId: "msg-1", publishTime: "2026-06-06T00:00:00Z" },
    subscription: "projects/test/subscriptions/gmail-watch-sub",
  });
  return new Request(`${origin}/ingress/google/pubsub`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${opts.token}`,
      "content-type": "application/json",
    },
    body,
  });
}
