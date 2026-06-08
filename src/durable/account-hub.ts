import type { Env } from "../env.ts";
import type { ResourceId } from "../providers/types.ts";
import type { ServerMessage } from "../protocol/messages.ts";
import { isClientMessage } from "../protocol/messages.ts";
import { log } from "../lib/log.ts";

/**
 * One AccountHub instance per linked Google account, addressed by
 * `ACCOUNT_HUB.idFromName(routingKey)`. It holds the set of live WebSocket
 * connections from every Cremind app that proved control of that account and
 * fans inbound "resync" nudges out to all of them.
 *
 * State model: there is NO durable storage. The only state is the live socket
 * set (via the Hibernation API) plus a small per-socket attachment. An idle hub
 * fully hibernates and costs nothing; if it is evicted, nothing is lost because
 * offline clients self-heal via incremental sync on reconnect.
 */
interface SocketAttachment {
  v: 1;
  /** Resources this connection wants nudges for. */
  resources: ResourceId[];
  /** Unix seconds when the relay-session expires; socket is closed past this. */
  sessionExp: number;
  /** Short opaque id for logging (never an email). */
  connId: string;
}

interface BroadcastBody {
  source: ResourceId;
  ts: number;
}

export class AccountHub {
  constructor(
    private readonly state: DurableObjectState,
    _env: Env,
  ) {
    // Answer protocol-level pings without waking the DO from hibernation.
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/broadcast") {
      return this.handleBroadcast(req);
    }

    if (req.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }
    return this.handleUpgrade(req);
  }

  private handleUpgrade(req: Request): Response {
    const attachment: SocketAttachment = {
      v: 1,
      resources: parseResources(req.headers.get("X-Sub-Resources")),
      sessionExp: Number.parseInt(req.headers.get("X-Sub-Session-Exp") ?? "0", 10) || 0,
      connId: req.headers.get("X-Sub-Conn-Id") ?? "anon",
    };
    const session = req.headers.get("X-Sub-Session") ?? "";

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    // Hibernatable accept; tag with resources so getWebSockets could be filtered.
    this.state.acceptWebSocket(server, attachment.resources);
    server.serializeAttachment(attachment);

    const hello: ServerMessage = {
      type: "hello",
      session,
      sessionExp: attachment.sessionExp,
      ts: Math.floor(Date.now() / 1000),
    };
    server.send(JSON.stringify(hello));

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleBroadcast(req: Request): Promise<Response> {
    let body: BroadcastBody;
    try {
      body = (await req.json()) as BroadcastBody;
    } catch {
      return new Response("bad broadcast body", { status: 400 });
    }
    const delivered = this.broadcast(body);
    return Response.json({ delivered });
  }

  private broadcast(body: BroadcastBody): number {
    const nowSec = Math.floor(Date.now() / 1000);
    const msg: ServerMessage = { type: "resync", source: body.source, ts: body.ts };
    const encoded = JSON.stringify(msg);

    let delivered = 0;
    for (const ws of this.state.getWebSockets()) {
      const att = ws.deserializeAttachment() as SocketAttachment | null;
      if (!att) continue;
      if (att.sessionExp && att.sessionExp < nowSec) {
        try {
          ws.close(4001, "session expired");
        } catch {
          /* already closed */
        }
        continue;
      }
      if (!att.resources.includes(body.source)) continue;
      try {
        ws.send(encoded);
        delivered++;
      } catch {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      }
    }
    log.info("broadcast", { event: "broadcast", resource: body.source, delivered });
    return delivered;
  }

  // --- Hibernation event handlers ---

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    if (typeof message !== "string") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }
    if (!isClientMessage(parsed)) return;

    // Currently the only client message narrows the resource subscription.
    const att = ws.deserializeAttachment() as SocketAttachment | null;
    if (!att) return;
    const next: SocketAttachment = { ...att, resources: sanitizeResources(parsed.resources) };
    ws.serializeAttachment(next);
  }

  webSocketClose(_ws: WebSocket, code: number, _reason: string, _wasClean: boolean): void {
    log.info("ws_close", { event: "ws_close", code });
  }

  webSocketError(_ws: WebSocket, _err: unknown): void {
    log.warn("ws_error", { event: "ws_error" });
  }
}

const VALID_RESOURCES: ResourceId[] = ["gmail", "calendar", "jira", "confluence"];

function sanitizeResources(input: unknown): ResourceId[] {
  if (!Array.isArray(input)) return [];
  const out = input.filter((r): r is ResourceId => VALID_RESOURCES.includes(r as ResourceId));
  return [...new Set(out)];
}

function parseResources(header: string | null): ResourceId[] {
  if (!header) return [...VALID_RESOURCES];
  return sanitizeResources(header.split(",").map((s) => s.trim()));
}
