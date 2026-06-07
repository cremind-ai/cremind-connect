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
        resources: { resource: string; pubsubTopic?: string; webhookUrl?: string }[];
      }[];
    };
    expect(body.relay.wsUrl).toBe("wss://connect.test/subscribe");
    const google = body.providers.find((p) => p.provider === "google")!;
    expect(google.authClientId).toBe("test-client.apps.googleusercontent.com");
    const gmail = google.resources.find((r) => r.resource === "gmail")!;
    expect(gmail.pubsubTopic).toBe("projects/test/topics/gmail-watch");
    const cal = google.resources.find((r) => r.resource === "calendar")!;
    expect(cal.webhookUrl).toBe("https://connect.test/ingress/google/calendar");
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
