# api.pangu.space on Cloudflare Workers

Three Workers, one directory each with its own `wrangler.jsonc`. Only the gateway is public.

| Worker | Language | Reached via |
| --- | --- | --- |
| `gateway/` | TypeScript, runs pangu-js itself | custom domain `api.pangu.space` |
| `pangu-py/` | Python Worker (Pyodide) | service binding, RPC method `space_text` |
| `pangu-go/` | Go compiled to WASM (`syumai/workers-go`) | service binding, fetch only |

The gateway owns `?lib=` dispatch, CORS, and the `{ text, lib, version }` envelope. Backends return only `{ text, version }`.

## Local dev

```bash
cd gateway && npm run dev
```

That runs all three via multi-config `wrangler dev -c ... -c ...` (experimental per Cloudflare). If it breaks, run one `dev` per directory in separate terminals; bindings connect across them.

## Deploy

Order matters: bindings resolve by name at deploy time, so backends go first.

```bash
(cd pangu-py && npm run deploy)
(cd pangu-go && npm run deploy)
(cd gateway && npm run deploy)
```

## Choices

- **Standard Go, not TinyGo.** TinyGo's `regexp` fails its own stdlib test suite. Standard Go WASM is larger but fits the 64 MiB Worker limit (raised 2026-09-04).
- **RPC for Python, fetch for Go.** Python Workers expose `WorkerEntrypoint` methods to JS callers; WASM Workers do not.
- **No `nodejs_compat` flag.** On by default for `compatibility_date >= 2026-08-04`. Add it if `node:fs` import fails.

## Unverified

- Free plan CPU limit is 10ms per invocation. Pyodide on long input may exceed it.
- pangu.go is assumed to publish `go.mod`, `pangu.SpacingText`, and `pangu.Version`.
