import pangu from "pangu";
import { applyAiSpacing, MAX_CANDIDATES, PROMPT_VERSIONS, TooManyCandidatesError } from "./ai-spacing/apply-ai-spacing";
import { AiQuotaExceededError, classifyOneCandidate, MODEL } from "./ai-spacing/classify";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };
const ALLOWED_METHODS = "GET, QUERY, POST, OPTIONS";

function errorResponse(status: number, code: string, message: string, headers: Record<string, string> = {}) {
  return Response.json({ error: { code, message } }, { status, headers: { ...CORS_HEADERS, ...headers } });
}

function spacedResponse(unspaced: string) {
  return Response.json({ text: pangu.spaceText(unspaced), lib: "pangu-js", version: pangu.version }, { headers: CORS_HEADERS });
}

async function aiSpacedResponse(unspaced: string, ai: Ai) {
  try {
    const { text, candidates } = await applyAiSpacing(unspaced, (promptSpec, candidate) => classifyOneCandidate(ai, promptSpec, candidate));
    return Response.json({ text, lib: "pangu-js", version: pangu.version, model: MODEL, promptVersions: PROMPT_VERSIONS, candidates }, { headers: CORS_HEADERS });
  } catch (error) {
    // Retrying the same text never succeeds, so this is not a 429
    if (error instanceof TooManyCandidatesError) {
      return errorResponse(413, "too_many_candidates", `the text has ${error.candidateCount} ambiguous spots, at most ${MAX_CANDIDATES} can be classified per request`);
    }
    if (error instanceof AiQuotaExceededError) {
      // The Workers AI free allocation resets at 00:00 UTC
      const now = new Date();
      const secondsToReset = Math.ceil((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - now.getTime()) / 1000);
      return errorResponse(429, "ai_quota_exceeded", "the daily AI quota is used up, retry without feature=ai-spacing or after 00:00 UTC", { "Retry-After": String(secondsToReset) });
    }
    throw error;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/text") {
      return errorResponse(404, "not_found", "not found");
    }

    const feature = url.searchParams.get("feature");
    if (feature !== null && feature !== "ai-spacing") {
      return errorResponse(400, "unknown_feature", `unknown feature: ${feature}`);
    }
    const respond = (unspaced: string) => (feature === null ? spacedResponse(unspaced) : aiSpacedResponse(unspaced, env.AI));

    if (request.method === "GET") {
      const unspaced = url.searchParams.get("text");
      if (unspaced === null) {
        return errorResponse(400, "missing_text", "missing query parameter: text");
      }
      return respond(unspaced);
    }

    if (request.method === "QUERY" || request.method === "POST") {
      const contentType = request.headers.get("Content-Type");
      if (contentType !== null && contentType.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
        return errorResponse(415, "unsupported_media_type", `unsupported Content-Type: ${contentType}; use application/json`, { "Accept-Query": "application/json" });
      }
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse(400, "invalid_json", "request body is not valid JSON");
      }
      if (typeof body !== "object" || body === null || !("text" in body) || typeof body.text !== "string") {
        return errorResponse(400, "missing_text", "body field text must be a string");
      }
      return respond(body.text);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...CORS_HEADERS, Allow: ALLOWED_METHODS, "Accept-Query": "application/json", "Access-Control-Allow-Methods": ALLOWED_METHODS, "Access-Control-Allow-Headers": "Content-Type" },
      });
    }

    return errorResponse(405, "method_not_allowed", `method not allowed: ${request.method}`, { Allow: ALLOWED_METHODS });
  },
} satisfies ExportedHandler<Env>;
