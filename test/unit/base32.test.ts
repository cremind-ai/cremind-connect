import { describe, it, expect } from "vitest";
import { base32Encode, base32Decode } from "../../src/lib/base32.ts";

const enc = (s: string) => base32Encode(new TextEncoder().encode(s));

describe("base32 (RFC 4648, lowercase, no padding)", () => {
  // Canonical RFC 4648 vectors, lowercased and stripped of '=' padding.
  it.each([
    ["", ""],
    ["f", "my"],
    ["fo", "mzxq"],
    ["foo", "mzxw6"],
    ["foob", "mzxw6yq"],
    ["fooba", "mzxw6ytb"],
    ["foobar", "mzxw6ytboi"],
  ])("encodes %j -> %j", (input, expected) => {
    expect(enc(input)).toBe(expected);
  });

  it("round-trips arbitrary bytes", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255, 128, 64, 16, 7]);
    expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
  });

  it("encodes a 16-byte slice to 26 chars (fits a calendar channel id)", () => {
    const bytes = new Uint8Array(16).fill(0xab);
    expect(base32Encode(bytes)).toHaveLength(26);
  });

  it("rejects invalid characters on decode", () => {
    expect(() => base32Decode("0189")).toThrow();
  });
});
