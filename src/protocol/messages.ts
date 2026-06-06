import type { ResourceId } from "../providers/types.ts";

/**
 * WebSocket wire protocol between the cremind skill listener (client) and the
 * AccountHub Durable Object (server).
 *
 * Design rule: server->client messages carry NO Google data (no email, no
 * historyId). A `resync` is a pure nudge; the client pulls the actual changes
 * from Google with its own token.
 */
export const SUBPROTOCOL = "cremind.relay.v1";

// --- server -> client ---
export interface HelloMessage {
  type: "hello";
  /** Short-lived relay-session JWT to present on reconnect (sub = routingKey). */
  session: string;
  /** Unix seconds at which `session` expires. */
  sessionExp: number;
  ts: number;
}

export interface ResyncMessage {
  type: "resync";
  /** Which surface changed, so the client only syncs the relevant API. */
  source: ResourceId;
  ts: number;
}

export interface ErrorMessage {
  type: "error";
  code: string;
  message: string;
}

export type ServerMessage = HelloMessage | ResyncMessage | ErrorMessage;

// --- client -> server ---
/** Narrow the set of resources this connection wants nudges for. */
export interface UpdateSubsMessage {
  type: "update_subs";
  resources: ResourceId[];
}

export type ClientMessage = UpdateSubsMessage;

export function isClientMessage(value: unknown): value is ClientMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "update_subs" &&
    Array.isArray((value as { resources?: unknown }).resources)
  );
}
