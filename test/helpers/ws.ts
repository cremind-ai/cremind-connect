import { SELF } from "cloudflare:test";

/**
 * Open a WebSocket to the Worker under test via SELF.fetch and return the client
 * end plus a small async message queue.
 */
export interface WsClient {
  ws: WebSocket;
  next(timeoutMs?: number): Promise<string>;
  close(): void;
}

export async function openWs(
  url: string,
  headers: Record<string, string> = {},
): Promise<WsClient> {
  const res = await SELF.fetch(url, {
    headers: { Upgrade: "websocket", ...headers },
  });
  if (res.status !== 101 || !res.webSocket) {
    throw new Error(`ws upgrade failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const ws = res.webSocket;
  ws.accept();

  const buffer: string[] = [];
  const waiters: ((v: string) => void)[] = [];
  ws.addEventListener("message", (e: MessageEvent) => {
    const data = typeof e.data === "string" ? e.data : new TextDecoder().decode(e.data as ArrayBuffer);
    const w = waiters.shift();
    if (w) w(data);
    else buffer.push(data);
  });

  return {
    ws,
    next(timeoutMs = 2000): Promise<string> {
      const queued = buffer.shift();
      if (queued !== undefined) return Promise.resolve(queued);
      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("ws message timeout")), timeoutMs);
        waiters.push((v) => {
          clearTimeout(timer);
          resolve(v);
        });
      });
    },
    close() {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    },
  };
}
