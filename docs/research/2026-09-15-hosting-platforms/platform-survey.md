# Platform survey

Where to host `api.pangu.space`: pangu.js plus AI Spacing for now. pangu.py and pangu.go come later, maybe on another host, called over HTTP. So the host is ranked on one Node runtime making many LLM calls per request, not on 3 runtimes. Each platform has a sketch in this repo. None of them has been deployed yet, so the cons below are from docs, not from getting burned. I've used all 3 before, so none of them is new to me.

Verdict: Cloudflare Workers. Waiting on the LLM costs nothing there, there is no duration cap, and the model is Workers AI on the same account.

## What AI Spacing changes

One request is N LLM calls, one per candidate. Gemma 4 on Workers AI takes 770ms on average, but one call stalled for 42.7s (see [llm-provider-eval.md](../2026-09-16-llm-provider-eval/llm-provider-eval.md)).

Run candidates one by one and duration caps bind: 500 candidates × 770ms = 385s. Run them in parallel and duration is roughly the slowest call, so the binding limits become calls per request and Workers AI's 300 requests/minute.

No host fixes the daily budget. About 3 neurons per candidate means about 3,300 candidates/day free, whether the call comes from a Worker or over REST from Vercel or Lambda. Every host needs a per-request candidate cap and a per-IP limit.

| | Cloudflare Workers Free | Vercel Hobby | AWS Lambda + CloudFront |
| --- | --- | --- | --- |
| Max request duration | No hard limit while the client stays connected | 300s, hard | Lambda 900s, but CloudFront waits 30s by default, 120s max without a quota request |
| Does waiting on the LLM cost? | No, only CPU counts (10ms) | Not Active CPU, but it is Provisioned Memory (2 GB fixed) | Yes, GB-seconds |
| Free allowance | 100,000 requests/day | 1M invocations, 4h Active CPU, 360 GB-hrs/month | 1M requests, 400,000 GB-seconds/month |
| Calls per request | 50 external, 1,000 to Cloudflare services | No cap, 1,024 file descriptors | No cap, 1,024 file descriptors |
| Runtime logs | AI Gateway logs every LLM call | Kept 1 hour | CloudWatch, until you expire them |
| Free rate limiting | 1 rule, per IP, 10s window, 10s block | No | No |

## Cloudflare Workers

Sketch: [cloudflare/](cloudflare/). The gateway Worker owns the custom domain and runs pangu.js itself.

Pros:

- `env.AI.run()` binding, no API token to store
- Waiting on network calls is not CPU time, so a slow LLM call is free
- AI Gateway logs every call, which is the point of the project

Cons:

- 50 external subrequests per request on Free. The OpenAI-compatible REST path from `llm-provider-eval.md` is a `fetch()`, so it counts there. The binding probably counts toward the 1,000 for Cloudflare services, but the docs only name R2, KV, and D1
- 10ms CPU per invocation for `spaceText` plus N `JSON.parse` on a 1,500-char input. Probably fine, unmeasured
- The free rate-limiting rule can't protect a daily budget: 1 rule, per IP, 10s window, 10s block. One IP sending 1 request every 10s with 50 candidates each is 432,000 candidates/day, 130x the budget
- Past 10,000 neurons/day, Workers AI calls fail with an error until 00:00 UTC. No bill, but AI Spacing is off for everyone, eval runs included
- Multi-config `wrangler dev` is marked experimental

## Vercel

Sketch: [vercel/](vercel/). One project, one file per function in `api/`.

Pros:

- Full Node.js coverage
- 300s is enough for AI Spacing if candidates run in parallel
- Free on Hobby

Cons:

- 300s is a hard cap on Hobby. 500 candidates one by one don't fit
- Waiting counts as Provisioned Memory: 360 GB-hrs ÷ 2 GB is 180 instance-hours a month, about 64,800 requests of 10s each. More with Fluid compute sharing instances
- Runtime logs are kept for 1 hour on Hobby. Bad for a project whose goal is learning from model behavior
- Rate limiting is not free
- Hobby is non-commercial only, and they pause accounts over it
- Calls Workers AI over REST with a stored token
- Runs in `iad1` by default. Not edge

## AWS Lambda

Sketch: [aws-lambda/](aws-lambda/). One SAM stack. CloudFront owns the domain and fronts Lambda Function URLs.

Pros:

- Permanent free tier on Lambda, CloudFront, and CloudFront Functions
- At 128 MB, 400,000 GB-seconds is 3.2M seconds a month, about 320,000 requests of 10s each
- One template, one `sam deploy`

Cons:

- CloudFront gives up after 30s by default, 120s max without a quota request. The sketch also sets `Timeout: 5` on the functions. Both need raising before any AI request works
- Waiting on the LLM is billed as GB-seconds
- GET only. With OAC in front of a Function URL, a POST body needs an `x-amz-content-sha256` header from the client, and browsers won't send it. That hurts more now, since long text for AI Spacing is the POST case. A public Function URL without OAC fixes it, but then anyone can call the URL directly
- Rate limiting needs WAF, which is not free
- Calls Workers AI over REST with a stored token
- IAM, ACM in `us-east-1`, CloudFront propagation. Every change takes minutes

## Later: pangu.py and pangu.go

Not ranking criteria anymore. For now, `lib=pangu-py` and `lib=pangu-go` answer 501. When they ship, the gateway gets one `fetch()` branch to wherever they live. A cross-vendor URL is public, so send a shared secret header if direct calls matter. py/go never call the LLM, so direct calls cost compute, not the neuron budget.

Facts from the 3-runtime sketches, still true:

- Cloudflare: Go is not first-class. It goes through `syumai/workers-go` and `GOOS=js GOARCH=wasm`. TinyGo's `regexp` fails its own stdlib tests, so standard Go it is. WASM Workers are fetch-only, no RPC. Python Workers are still marked experimental, and Pyodide may not fit 10ms CPU on long input
- Vercel: Python and Go are official runtimes, but run in `iad1` only. Functions get archived after 2 weeks idle, so the first request after that adds 1s+. A rewrite to an external host times out after 120s
- AWS Lambda: native `python3.14` and `provided.al2023` on arm64. A CloudFront Function swaps the origin by `?lib=` with no extra invocation. The 3-function template is 176 lines of YAML

The `lib` query param can't be routed by any CDN or gateway, so something in code has to read it. Path routing like `/pangu-py/text` would remove that hop. I like the query param more.

## Ruled out

- Cloudflare Containers: needs the $5/mo Workers Paid plan
- Fly.io: no free tier for new accounts since Oct 2024
- Render free: spins down after 15 min idle
- Koyeb free: works, but 1 instance per org and 2 regions
- Deno Deploy: JS only

## Unverified

- Whether `env.AI.run()` counts toward the 50 external subrequests or the 1,000 for Cloudflare services. One deploy and one request with 60 candidates answers it
- `spaceText` plus N `JSON.parse` on a 1,500-char input fits 10ms CPU
- `nodejs_compat` is on by default for compatibility dates from 2026-08-04. Single docs fetch

ref:
https://developers.cloudflare.com/workers/platform/limits/
https://developers.cloudflare.com/workers/platform/pricing/
https://developers.cloudflare.com/changelog/post/2026-02-11-subrequests-limit/
https://developers.cloudflare.com/workers-ai/platform/limits/
https://developers.cloudflare.com/workers-ai/platform/pricing/
https://developers.cloudflare.com/waf/rate-limiting-rules/
https://vercel.com/docs/functions/limitations
https://vercel.com/docs/limits
https://vercel.com/docs/limits/fair-use-guidelines
https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html
https://aws.amazon.com/lambda/pricing/
https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesOrigin.html
https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html
https://vercel.com/docs/functions/runtimes
https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/rpc/
https://developers.cloudflare.com/workers/languages/python/
https://github.com/syumai/workers-go
https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/helper-functions-origin-modification.html
https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-lambda.html
https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
