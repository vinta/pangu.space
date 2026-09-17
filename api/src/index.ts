import pangu from "pangu";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/text") {
      return Response.json({ error: "not found" }, { status: 404, headers: CORS_HEADERS });
    }

    const unspaced = url.searchParams.get("t");
    if (unspaced === null) {
      return Response.json({ error: "missing query parameter: t" }, { status: 400, headers: CORS_HEADERS });
    }

    return Response.json({ text: pangu.spaceText(unspaced), lib: "pangu-js", version: pangu.version }, { headers: CORS_HEADERS });
  },
} satisfies ExportedHandler<Env>;
