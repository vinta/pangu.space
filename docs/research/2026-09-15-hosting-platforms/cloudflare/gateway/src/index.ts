import pangu from 'pangu';

interface Env {
  // Python Worker exposes an RPC method; the call crosses Workers without HTTP
  PY: { space_text(t: string): Promise<{ text: string; version: string }> };
  // WASM Workers are fetch-only, no RPC
  GO: Fetcher;
}

interface Spaced {
  text: string;
  lib: string;
  version: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

async function space(lib: string, t: string, env: Env): Promise<Spaced | undefined> {
  switch (lib) {
    case 'pangu-js':
      return { text: pangu.spaceText(t), lib, version: pangu.version };
    case 'pangu-py': {
      const { text, version } = await env.PY.space_text(t);
      return { text, lib, version };
    }
    case 'pangu-go': {
      // Host is ignored by service bindings; only the path and query reach the target
      const res = await env.GO.fetch(`https://pangu-go/text?t=${encodeURIComponent(t)}`);
      const { text, version } = await res.json<{ text: string; version: string }>();
      return { text, lib, version };
    }
    default:
      return undefined;
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/text') {
      return json({ error: 'not found' }, 404);
    }

    const t = url.searchParams.get('t') ?? '';
    const lib = url.searchParams.get('lib') ?? 'pangu-js';
    const spaced = await space(lib, t, env);
    if (spaced === undefined) {
      return json({ error: `unknown lib: ${lib}` }, 400);
    }
    return json(spaced);
  },
} satisfies ExportedHandler<Env>;
