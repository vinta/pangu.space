# Cloudflare Containers

Read from the Cloudflare docs on 2026-09-17. Nothing here has been deployed.

Verdict: not now. Containers need the $5/mo Workers Paid plan, and AI Spacing gains nothing from them. They matter only if pangu.py or pangu.go can't run on Workers itself.

## Workers vs Containers

Workers run JS/TS, WASM, or Python on Pyodide in V8 isolates, on every Cloudflare location. Containers run any linux/amd64 Docker image as a Linux process. A container isn't public: a Worker sits in front of it and forwards requests. So Containers are an add-on to Workers, not a replacement.

A container class extends `Container`, which is a Durable Object. Each instance has an ID, and the same ID always reaches the same instance. `sleepAfter` stops an idle instance, and the next request pays a cold start of 1-3s, depending on image size and startup time. A running instance stays in one location. After a restart it may come back somewhere else.

## Any language, same routing

Any language works, as long as it builds into a linux/amd64 image and serves HTTP on a port. The routing stays the same: `api.pangu.space` hits the one Worker, the Worker reads `?lib=`, and forwards the original request to a container binding:

```ts
import { Container, getContainer } from "@cloudflare/containers";

export class PanguPy extends Container { defaultPort = 8080; sleepAfter = "10m"; }
export class PanguGo extends Container { defaultPort = 8080; sleepAfter = "10m"; }

export default {
  async fetch(request, env) {
    const lib = new URL(request.url).searchParams.get("lib") ?? "pangu-js";
    if (lib === "pangu-py") return getContainer(env.PANGU_PY, "default").fetch(request);
    if (lib === "pangu-go") return getContainer(env.PANGU_GO, "default").fetch(request);
    // pangu-js runs in the Worker itself
  },
};
```

- One class per runtime, each with its own `containers` entry, Dockerfile, and Durable Object binding in `wrangler`
- The container sees the same path and query string, so it serves `/text` like the Worker does
- It's the `fetch()` branch the platform survey already planned for py/go, just with a binding instead of a URL. No shared secret header, since the container isn't public
- pangu.py and pangu.go are libraries, so each needs a small HTTP wrapper: `http.server` or FastAPI, and `net/http`

## getRandom vs getContainer

`getContainer(binding, "default")` always hits one instance. `getRandom(binding, N)` picks a random ID from `0` to `N-1`, so traffic spreads across N instances. Containers have no built-in autoscaling for stateless apps, and `getRandom` is the do-it-yourself version. It's random, not load-aware: it doesn't know which instance is busy, healthy, or awake.

Use `getContainer` with one fixed ID. Each instance sleeps on its own timer, so with low traffic `getRandom` means more cold starts, and every awake instance bills memory and disk. Switch only if one instance gets too slow.

## Pros

- Real CPython and a native Go binary, instead of Pyodide or `GOOS=js GOARCH=wasm`
- No 10ms CPU cap. From `lite` (1/16 vCPU, 256 MiB) to `standard-4` (4 vCPU, 12 GiB), or custom up to 4 vCPU / 12 GiB / 20 GB disk
- Durable Object SQLite storage survives container restarts
- Same deploy and same domain as the Worker

## Cons

- Workers Paid only, $5/mo. No free plan
- Paid includes 25 GiB-hours memory, 375 vCPU-minutes, and 200 GB-hours disk per month, billed in 10ms steps after that. Memory and disk bill on what you provision, not what you use
- 1-3s cold start after `sleepAfter`. A toy API with little traffic pays it on most requests, unless you keep it warm and pay for that
- More moving parts: Dockerfile, image build and push on every deploy, Durable Object migration
- One location per instance, not everywhere
- Useless for AI Spacing: waiting on the LLM is free on Workers, but a container bills memory for the whole wait

## Unverified

- Whether Containers is still beta or GA
- Per-second prices past the included usage, and egress
- How `getContainer` behaves while the instance is still cold-starting
- Whether py/go on Workers (Pyodide, WASM) actually fail 10ms CPU. If they don't, Containers are never needed

ref:
https://developers.cloudflare.com/containers/
https://developers.cloudflare.com/containers/platform-details/limits/
https://developers.cloudflare.com/containers/faq/
https://developers.cloudflare.com/workers/platform/pricing/
https://github.com/cloudflare/containers
