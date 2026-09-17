import pangu from "pangu";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers: CORS_HEADERS });
}

export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/text") {
      return errorResponse(404, "not_found", "not found");
    }

    const unspaced = url.searchParams.get("text");
    if (unspaced === null) {
      return errorResponse(400, "missing_text", "missing query parameter: text");
    }

    return Response.json({ text: pangu.spaceText(unspaced), lib: "pangu-js", version: pangu.version }, { headers: CORS_HEADERS });
  },
} satisfies ExportedHandler<Env>;
