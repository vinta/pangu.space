import { env, exports } from "cloudflare:workers";
import pangu from "pangu";
import { afterEach, describe, expect, it, vi } from "vitest";

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

describe("feature=ai-spacing", () => {
  const AI_TEXT_URL = `${TEXT_URL}?feature=ai-spacing&text=${encodeURIComponent("今天-5度")}`;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("applies the model's label", async () => {
    const run = vi.spyOn(env.AI, "run").mockResolvedValue({ choices: [{ message: { content: "signed-number" } }] });
    const response = await exports.default.fetch(AI_TEXT_URL);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      text: "今天 -5 度",
      lib: "pangu-js",
      version: pangu.version,
      model: "@cf/google/gemma-4-26b-a4b-it",
      promptVersions: { "hyphen-digit": "v29-zh", "digit-plus": "v18-en-real-examples" },
      candidates: [{ kind: "hyphen-digit", sentence: "今天-5度", at: 2, label: "signed-number" }],
    });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("falls back to the rules when the model fails", async () => {
    vi.spyOn(env.AI, "run").mockRejectedValue(new Error("3040: Capacity temporarily exceeded, please try again"));
    const response = await exports.default.fetch(AI_TEXT_URL);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ text: "今天 - 5 度", candidates: [{ label: null }] });
  });

  it("answers 429 when the daily quota is used up", async () => {
    vi.spyOn(env.AI, "run").mockRejectedValue(new Error("3036: You have used up your daily free allocation of 10,000 neurons"));
    const response = await exports.default.fetch(AI_TEXT_URL);
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(await response.json()).toMatchObject({ error: { code: "ai_quota_exceeded" } });
  });

  it("rejects a text past the candidate cap", async () => {
    const run = vi.spyOn(env.AI, "run");
    const response = await exports.default.fetch(`${TEXT_URL}?feature=ai-spacing&text=${encodeURIComponent("今天-5度，".repeat(21))}`);
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: { code: "too_many_candidates", message: "the text has 21 ambiguous spots, at most 20 can be classified per request" } });
    expect(run).not.toHaveBeenCalled();
  });

  it("rejects an unknown feature", async () => {
    const response = await exports.default.fetch(`${TEXT_URL}?feature=nope&text=a`);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "unknown_feature", message: "unknown feature: nope" } });
  });
});
