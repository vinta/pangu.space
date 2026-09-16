# api.pangu.space on Vercel

One Vercel project, three runtimes. Each file in `api/` becomes its own function; the runtime is picked by file extension.

| Route | File | Runtime |
| --- | --- | --- |
| `/text?t=...&lib=...` | `api/text.ts` | Node, dispatches on `lib` |
| `/api/js?t=...` | `api/js.ts` | Node |
| `/api/py?t=...` | `api/py.py` | Python |
| `/api/go?t=...` | `api/go.go` | Go |

`vercel.json` rewrites `/text` to `/api/text`. Manifests for all three languages sit in this directory, which is the Vercel project root. In the Vercel dashboard set Root Directory to `docs/research/2026-09-15-hosting-platforms/vercel`.

Assumes pangu.go publishes `go.mod`, `pangu.SpacingText`, and `pangu.Version`.
