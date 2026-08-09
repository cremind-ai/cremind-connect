/**
 * Low-level JWT helpers built on WebCrypto (available in Workers without
 * nodejs_compat). Supports:
 *   - RS256 verification (Google ID tokens)
 *   - HS256 sign/verify (our own short-lived relay-session tokens)
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function base64UrlDecodeToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function base64UrlDecodeToString(input: string): string {
  return decoder.decode(base64UrlDecodeToBytes(input));
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  /** The bytes that were signed: base64url(header) + "." + base64url(payload). */
  signingInput: Uint8Array;
  signature: Uint8Array;
}

/** Parse a compact JWT into its parts. Throws on structural errors only. */
export function decodeJwt(token: string): DecodedJwt {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed jwt: expected 3 segments");
  const [h, p, s] = parts as [string, string, string];
  const header = JSON.parse(base64UrlDecodeToString(h)) as Record<string, unknown>;
  const payload = JSON.parse(base64UrlDecodeToString(p)) as Record<string, unknown>;
  return {
    header,
    payload,
    signingInput: encoder.encode(`${h}.${p}`),
    signature: base64UrlDecodeToBytes(s),
  };
}

/** Verify an RS256 signature against a public JWK. */
export async function verifyRs256(jwt: DecodedJwt, jwk: JsonWebKey): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    jwt.signature as unknown as BufferSource,
    jwt.signingInput as unknown as BufferSource,
  );
}

async function hmacKey(secret: string, usages: ("sign" | "verify")[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );
}

/** Mint a compact HS256 JWT. */
export async function signHs256(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const input = `${header}.${body}`;
  const key = await hmacKey(secret, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(input));
  return `${input}.${base64UrlEncode(new Uint8Array(sig))}`;
}

/** Verify an HS256 JWT signature against `secret`. Returns the payload or null. */
export async function verifyHs256(
  token: string,
  secret: string,
): Promise<Record<string, unknown> | null> {
  let jwt: DecodedJwt;
  try {
    jwt = decodeJwt(token);
  } catch {
    return null;
  }
  if (jwt.header.alg !== "HS256") return null;
  const key = await hmacKey(secret, ["verify"]);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    jwt.signature as unknown as BufferSource,
    jwt.signingInput as unknown as BufferSource,
  );
  return ok ? jwt.payload : null;
}

/** Constant-time-ish string comparison for short secrets/tokens. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** HMAC-SHA256(key, message) as lowercase hex. */
export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await hmacKey(secret, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
