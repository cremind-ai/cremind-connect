import { describe, it, expect } from "vitest";
import { accountKeyFor, normalizeEmail } from "../../src/routing/account-key.ts";
import golden from "../golden/account-keys.json";

describe("accountKeyFor (cross-repo routing contract)", () => {
  it("matches every golden vector", async () => {
    for (const v of golden.vectors) {
      expect(await accountKeyFor("google", v.email)).toBe(v.accountKey);
    }
  });

  it("is case- and whitespace-insensitive", async () => {
    const a = await accountKeyFor("google", "abc@gmail.com");
    expect(await accountKeyFor("google", "  ABC@Gmail.com  ")).toBe(a);
  });

  it("does NOT collapse Gmail dots/+suffix (Workspace-safe)", async () => {
    const plain = await accountKeyFor("google", "user@gmail.com");
    const dotted = await accountKeyFor("google", "u.s.e.r@gmail.com");
    const tagged = await accountKeyFor("google", "user+tag@gmail.com");
    expect(dotted).not.toBe(plain);
    expect(tagged).not.toBe(plain);
  });

  it("produces a 26-char base32 key", async () => {
    const key = await accountKeyFor("google", "someone@example.com");
    expect(key).toMatch(/^[a-z2-7]{26}$/);
  });

  it("normalizeEmail lowercases and trims only", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
});
