import { exports } from "cloudflare:workers";
import pangu from "pangu";
import { describe, expect, it } from "vitest";

describe("GET /text", () => {
  it("spaces text with pangu-js", async () => {
    const response = await exports.default.fetch(`https://api.pangu.space/text?text=${encodeURIComponent("中文abc")}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(await response.json()).toEqual({ text: "中文 abc", lib: "pangu-js", version: pangu.version });
  });

  it("rejects a missing text", async () => {
    const response = await exports.default.fetch("https://api.pangu.space/text");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "missing_text", message: "missing query parameter: text" } });
  });

  it("returns 404 for other paths", async () => {
    const response = await exports.default.fetch("https://api.pangu.space/");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "not_found", message: "not found" } });
  });
});
