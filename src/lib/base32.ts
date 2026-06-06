/**
 * RFC 4648 base32, lowercase, no padding.
 *
 * Used to render the routing key (a 16-byte / 128-bit hash slice) as a short,
 * URL- and channel-id-safe string. 16 bytes -> 26 characters.
 *
 * The encoding MUST stay byte-identical to the Python implementation in the
 * cremind skills repo (see the shared golden vectors), or event nudges will be
 * routed to the wrong Durable Object and silently never arrive.
 */
const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567"; // RFC 4648 alphabet, lowercased

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]!;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

const REVERSE: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (let i = 0; i < ALPHABET.length; i++) m[ALPHABET[i]!] = i;
  return m;
})();

/** Decode a lowercase, unpadded base32 string. Throws on invalid characters. */
export function base32Decode(input: string): Uint8Array {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of input) {
    const idx = REVERSE[ch];
    if (idx === undefined) throw new Error(`invalid base32 character: ${ch}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}
