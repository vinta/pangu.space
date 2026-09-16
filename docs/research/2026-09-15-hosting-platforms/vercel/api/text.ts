// Front door. Vercel routes by path only, so `?lib=` has to be read in code and forwarded to the sibling function
const LIBS: Record<string, string> = {
  'pangu-js': '/api/js',
  'pangu-py': '/api/py',
  'pangu-go': '/api/go',
};

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const lib = url.searchParams.get('lib') ?? 'pangu-js';
    const target = LIBS[lib];
    if (target === undefined) {
      return Response.json({ error: `unknown lib: ${lib}` }, { status: 400 });
    }

    const upstream = await fetch(new URL(target + url.search, url.origin));
    const headers = new Headers(upstream.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
