import { base32Encode } from "../lib/base32.ts";

/**
 * Google Calendar watch channel ids encode the routing key so the relay can route
 * an inbound webhook to the right Durable Object hub WITHOUT any stored mapping.
 *
 * Format:  cm.<routingKey>.<nonce>
 *   - "cm"        : fixed namespace tag (cremind)
 *   - routingKey  : 26-char base32 (from accountKeyFor)
 *   - nonce       : random per-channel suffix so re-watches get a fresh channel id
 *
 * Length budget: 3 ("cm.") + 26 + 1 (".") + nonce. Google caps channel id at 64
 * chars, so the nonce can be up to 34 chars; we use 16.
 *
 * The client (cremind skill) builds the channel id with this exact format when it
 * calls events.watch(); the relay parses it from the X-Goog-Channel-ID header.
 */
const PREFIX = "cm";
const NONCE_LEN = 16;
export const MAX_CHANNEL_ID_LEN = 64;

const CHANNEL_ID_RE = /^cm\.([a-z2-7]{26})\.([a-z2-7]{1,34})$/;

export function randomNonce(len: number = NONCE_LEN): string {
  const bytes = new Uint8Array(Math.ceil((len * 5) / 8));
  crypto.getRandomValues(bytes);
  return base32Encode(bytes).slice(0, len);
}

export function buildCalendarChannelId(routingKey: string, nonce: string = randomNonce()): string {
  const id = `${PREFIX}.${routingKey}.${nonce}`;
  if (id.length > MAX_CHANNEL_ID_LEN) {
    throw new Error(`channel id exceeds ${MAX_CHANNEL_ID_LEN} chars: ${id.length}`);
  }
  return id;
}

export interface ParsedChannelId {
  routingKey: string;
  nonce: string;
}

/** Parse a cremind channel id. Returns null if it isn't ours / is malformed. */
export function parseCalendarChannelId(channelId: string): ParsedChannelId | null {
  const m = CHANNEL_ID_RE.exec(channelId);
  if (!m) return null;
  return { routingKey: m[1]!, nonce: m[2]! };
}
