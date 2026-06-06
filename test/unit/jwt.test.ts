import { describe, it, expect } from "vitest";
import {
  base64UrlEncode,
  base64UrlDecodeToBytes,
  base64UrlDecodeToString,
  signHs256,
  verifyHs256,
  timingSafeEqual,
  hmacSha256Hex,
} from "../../src/auth/jwt.ts";

describe("jwt primitives", () => {
  it("base64url round-trips bytes and strings", () => {
    const bytes = new Uint8Array([0, 255, 16, 32, 64, 128, 5]);
    expect(base64UrlDecodeToBytes(base64UrlEncode(bytes))).toEqual(bytes);
    const s = "héllo+/=world";
    const reencoded = base64UrlEncode(new TextEncoder().encode(s));
    expect(reencoded).not.toMatch(/[+/=]/); // url-safe, unpadded
    expect(base64UrlDecodeToString(reencoded)).toBe(s);
  });

  it("HS256 sign/verify happy path", async () => {
    const token = await signHs256({ sub: "x", n: 1 }, "secret");
    const payload = await verifyHs256(token, "secret");
    expect(payload).toMatchObject({ sub: "x", n: 1 });
  });

  it("HS256 verify fails with the wrong secret", async () => {
    const token = await signHs256({ sub: "x" }, "secret");
    expect(await verifyHs256(token, "other")).toBeNull();
  });

  it("timingSafeEqual compares correctly", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });

  it("hmacSha256Hex is deterministic", async () => {
    const a = await hmacSha256Hex("k", "message");
    const b = await hmacSha256Hex("k", "message");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
