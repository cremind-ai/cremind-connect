import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("basic routes", () => {
  it("GET /healthz returns ok", async () => {
    const res = await SELF.fetch("https://connect.test/healthz");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("GET /.well-known/cremind-connect describes the Google provider", async () => {
    const res = await SELF.fetch("https://connect.test/.well-known/cremind-connect");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      relay: { wsUrl: string };
      providers: {
        provider: string;
        authClientId: string;
        scopes?: string[];
        resources: { resource: string; scopes: string[]; pubsubTopic?: string; webhookUrl?: string }[];
      }[];
    };
    expect(body.relay.wsUrl).toBe("wss://connect.test/subscribe");
    const google = body.providers.find((p) => p.provider === "google")!;
    expect(google.authClientId).toBe("test-client.apps.googleusercontent.com");
    // Scopes are per-resource (least privilege) — no provider-level combined list.
    expect(google.scopes).toBeUndefined();
    const gmail = google.resources.find((r) => r.resource === "gmail")!;
    expect(gmail.pubsubTopic).toBe("projects/test/topics/gmail-watch");
    expect(gmail.scopes).toEqual([
      "openid",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ]);
    const cal = google.resources.find((r) => r.resource === "calendar")!;
    expect(cal.webhookUrl).toBe("https://connect.test/ingress/google/calendar");
    expect(cal.scopes).toEqual(["openid", "email", "https://www.googleapis.com/auth/calendar.events"]);
    // Drive carries a webhookUrl (changes.watch push); Sheets/Docs are poll-only
    // (scopes but no ingress).
    const drive = google.resources.find((r) => r.resource === "drive")!;
    expect(drive.webhookUrl).toBe("https://connect.test/ingress/google/drive");
    expect(drive.scopes).toEqual(["openid", "email", "https://www.googleapis.com/auth/drive"]);
    const sheets = google.resources.find((r) => r.resource === "sheets")!;
    expect(sheets.webhookUrl).toBeUndefined();
    expect(sheets.pubsubTopic).toBeUndefined();
    expect(sheets.scopes).toEqual(["openid", "email", "https://www.googleapis.com/auth/spreadsheets"]);
    const docs = google.resources.find((r) => r.resource === "docs")!;
    expect(docs.webhookUrl).toBeUndefined();
    expect(docs.scopes).toEqual(["openid", "email", "https://www.googleapis.com/auth/documents"]);
  });

  it("GET /credentials/google returns the OAuth client id + secret", async () => {
    const res = await SELF.fetch("https://connect.test/credentials/google");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
    expect(await res.json()).toMatchObject({
      provider: "google",
      clientId: "test-client.apps.googleusercontent.com",
      clientSecret: "test-secret-do-not-use",
    });
  });

  it("GET /credentials/<unknown> returns 404", async () => {
    const res = await SELF.fetch("https://connect.test/credentials/microsoft");
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: "unknown_provider" });
  });

  it("unknown route returns 404", async () => {
    const res = await SELF.fetch("https://connect.test/nope");
    expect(res.status).toBe(404);
  });
});
