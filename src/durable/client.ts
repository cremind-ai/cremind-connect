import type { Env } from "../env.ts";
import type { Notification, ResourceId } from "../providers/types.ts";

/**
 * Fan a notification out to the per-account hub. Returns how many live sockets
 * received it (0 if no app is currently connected for that account — which is
 * fine; offline apps self-heal via incremental sync on reconnect).
 */
export async function broadcastToHub(env: Env, note: Notification): Promise<number> {
  const id = env.ACCOUNT_HUB.idFromName(note.accountKey);
  const stub = env.ACCOUNT_HUB.get(id);
  const body: { source: ResourceId; ts: number } = {
    source: note.resource,
    ts: Math.floor(Date.now() / 1000),
  };
  const res = await stub.fetch("https://hub/broadcast", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return 0;
  const parsed = (await res.json()) as { delivered?: number };
  return parsed.delivered ?? 0;
}

/** Get a hub stub for forwarding a WebSocket upgrade. */
export function hubStub(env: Env, routingKey: string): DurableObjectStub {
  return env.ACCOUNT_HUB.get(env.ACCOUNT_HUB.idFromName(routingKey));
}
