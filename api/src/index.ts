import pangu from "pangu";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };
const ALLOWED_METHODS = "GET, POST, OPTIONS";

function errorResponse(status: number, code: string, message: string, headers: Record<string, string> = {}) {
  return Response.json({ error: { code, message } }, { status, headers: { ...CORS_HEADERS, ...headers } });
}

function spacedResponse(unspaced: string) {
  return Response.json({ text: pangu.spaceText(unspaced), lib: "pangu-js", version: pangu.version }, { headers: CORS_HEADERS });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/text") {
      return errorResponse(404, "not_found", "not found");
    }

    if (request.method === "GET") {
      const unspaced = url.searchParams.get("text");
      if (unspaced === null) {
        return errorResponse(400, "missing_text", "missing query parameter: text");
      }
      return spacedResponse(unspaced);
    }

    if (request.method === "POST") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse(400, "invalid_json", "request body is not valid JSON");
      }
      if (typeof body !== "object" || body === null || !("text" in body) || typeof body.text !== "string") {
        return errorResponse(400, "missing_text", "body field text must be a string");
      }
      return spacedResponse(body.text);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...CORS_HEADERS, "Access-Control-Allow-Methods": ALLOWED_METHODS, "Access-Control-Allow-Headers": "Content-Type" },
      });
    }

    return errorResponse(405, "method_not_allowed", `method not allowed: ${request.method}`, { Allow: ALLOWED_METHODS });
  },
} satisfies ExportedHandler<Env>;
