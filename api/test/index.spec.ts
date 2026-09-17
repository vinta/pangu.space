import { exports } from "cloudflare:workers";
import pangu from "pangu";
import { describe, expect, it } from "vitest";

const TEXT_URL = "https://api.pangu.space/text";

describe("GET /text", () => {
  it("spaces text with pangu-js", async () => {
    const response = await exports.default.fetch(`${TEXT_URL}?text=${encodeURIComponent("中文abc")}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(await response.json()).toEqual({ text: "中文 abc", lib: "pangu-js", version: pangu.version });
  });

  it("rejects a missing text", async () => {
    const response = await exports.default.fetch(TEXT_URL);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "missing_text", message: "missing query parameter: text" } });
  });
});

describe("POST /text", () => {
  it("spaces text from a JSON body", async () => {
    const response = await exports.default.fetch(TEXT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "中文abc" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(await response.json()).toEqual({ text: "中文 abc", lib: "pangu-js", version: pangu.version });
  });

  it("rejects a body that is not JSON", async () => {
    const response = await exports.default.fetch(TEXT_URL, { method: "POST", body: "中文abc" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "invalid_json", message: "request body is not valid JSON" } });
  });

  it("rejects a body without a string text", async () => {
    const response = await exports.default.fetch(TEXT_URL, { method: "POST", body: JSON.stringify({ text: 1 }) });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "missing_text", message: "body field text must be a string" } });
  });
});

describe("/text", () => {
  it("answers CORS preflight", async () => {
    const response = await exports.default.fetch(TEXT_URL, { method: "OPTIONS" });
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
  });

  it("rejects other methods", async () => {
    const response = await exports.default.fetch(TEXT_URL, { method: "PUT" });
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, POST, OPTIONS");
    expect(await response.json()).toEqual({ error: { code: "method_not_allowed", message: "method not allowed: PUT" } });
  });

  it("returns 404 for other paths", async () => {
    const response = await exports.default.fetch("https://api.pangu.space/");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "not_found", message: "not found" } });
  });
});
