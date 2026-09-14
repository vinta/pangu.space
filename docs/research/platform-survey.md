# Platform survey

Where to host `api.pangu.space`: one domain, 3 runtimes (pangu.js, pangu.py, pangu.go), picked by `?lib=`. Each platform has a sketch in this repo. None of them has been deployed yet, so the cons below are from docs, not from getting burned. I've used all 3 before, so none of them is new to me. New stuff can wait for the AI Spacing stage.

Common to all 3: the `lib` query param can't be routed by any CDN or gateway, so something in code has to read it. Path routing like `/pangu-py/text` would remove that hop. I like the query param more.

## Vercel

Sketch: [vercel/](../../platforms/vercel/). One project, one file per function in `api/`, runtime picked by file extension. A Node front door forwards `?lib=` to the sibling function over HTTP.

Pros:

- Zero config for 3 languages. Node, Python, and Go are all official runtimes
- Standard Go, standard Python, no WASM, no Pyodide
- One deploy, one domain, TLS handled
- Free on Hobby

Cons:

- Hobby is non-commercial only, and they pause accounts over it
- Python and Go run in `iad1` only. Not edge
- The front door is an extra HTTP hop and 2 invocations per request
- Functions get archived after 2 weeks idle, so the first request after that adds 1s+
- 12 functions per deployment on Hobby. Fine for 4

## Cloudflare Workers

Sketch: [cloudflare/](../../platforms/cloudflare/). 3 Workers, one directory each. The gateway owns the custom domain and runs pangu.js itself. It calls the Python Worker by RPC and the Go Worker by fetch, both via service bindings.

Pros:

- Edge, free, one vendor, one `wrangler` toolchain
- Python Workers expose plain async methods as RPC. No HTTP between Workers

Cons:

- Free plan caps CPU at 10ms per invocation. Pyodide on a long input may not fit. Unmeasured
- Go is not a first-class language. It goes through `syumai/workers-go` and `GOOS=js GOARCH=wasm`
- TinyGo's `regexp` fails its own stdlib tests, so standard Go it is. Bigger binary, slower cold start
- WASM Workers are fetch-only, no RPC
- Multi-config `wrangler dev` is marked experimental
- Python Workers themselves are still marked experimental in Cloudflare's own examples

## AWS Lambda

Sketch: [aws-lambda/](../../platforms/aws-lambda/). One SAM stack. CloudFront owns the domain and fronts 3 Lambda Function URLs. A CloudFront Function reads `?lib=` and swaps the origin with `selectRequestOriginById()`. No router Lambda, no API Gateway.

Pros:

- Native runtimes for all 3: `nodejs24.x`, `python3.14`, `provided.al2023` on arm64
- Permanent free tier on Lambda, CloudFront, and CloudFront Functions. API Gateway would be free for 12 months only
- Routing happens at the edge with no extra invocation
- One template, one `sam deploy`

Cons:

- GET only for now. With OAC in front of a Function URL, a POST body needs an `x-amz-content-sha256` header from the client. Browsers won't send it
- The most YAML. 176 lines for 3 functions
- IAM, ACM in `us-east-1`, CloudFront propagation. Every change takes minutes
- CloudWatch logs never expire unless you say so, so the template does

## Ruled out

- Cloudflare Containers: needs the $5/mo Workers Paid plan
- Fly.io: no free tier for new accounts since Oct 2024
- Render free: spins down after 15 min idle
- Koyeb free: works, but 1 instance per org and 2 regions
- Deno Deploy: JS only

## Unverified

- Free LLM API gateways beat Gemini Nano. The `ai-spacing` prompts were tuned against Nano
- pangu.go publishes `go.mod`, `SpacingText`, and `Version`. All 3 sketches assume it
- Pyodide fits 10ms CPU on a 5k-char input
- `nodejs_compat` is on by default for compatibility dates from 2026-08-04. Single docs fetch

ref:
https://vercel.com/docs/functions/runtimes
https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/rpc/
https://developers.cloudflare.com/workers/languages/python/
https://github.com/syumai/workers-go
https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/helper-functions-origin-modification.html
https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-lambda.html
https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
