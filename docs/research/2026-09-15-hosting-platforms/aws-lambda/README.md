# api.pangu.space on AWS Lambda

One SAM stack. CloudFront owns the domain and picks a Lambda per request.

```
api.pangu.space ── CloudFront ── viewer-request CloudFront Function reads ?lib=
                     │             and calls cf.selectRequestOriginById()
                     ├── origin pangu-js  ── Function URL ── Lambda nodejs24.x     (default)
                     ├── origin pangu-py  ── Function URL ── Lambda python3.14
                     └── origin pangu-go  ── Function URL ── Lambda provided.al2023, arm64 bootstrap
```

No router Lambda, no API Gateway. Function URLs use IAM auth and only CloudFront's Origin Access Control can sign for them. CORS comes from CloudFront's managed policy, so the handlers return plain JSON and let Lambda infer status 200 and the content type.

## Layout

| Path | Built by |
| --- | --- |
| `template.yaml` | the whole stack, including the CloudFront Function source |
| `pangu-js/` | SAM npm builder, `index.mjs` + `package.json` |
| `pangu-py/` | SAM pip builder, `handler.py` + `requirements.txt` |
| `pangu-go/` | SAM Go builder, `main.go` + `go.mod`, emits `bootstrap` |

## Deploy

1. Request an ACM certificate for `api.pangu.space` in `us-east-1`. Add its validation CNAME at Cloudflare.
2. Put the certificate ARN in `samconfig.toml`.
3. `sam build && sam deploy`
4. Add a CNAME at Cloudflare from `api.pangu.space` to the `DistributionDomainName` output. DNS only, grey cloud. Proxying through Cloudflare as well would double-proxy.

## Choices

- **CloudFront Function, not a URI rewrite.** CloudFront picks the cache behavior and origin from the original URI. Rewriting `request.uri` to `/pangu-py/text` would still hit the default origin. The JS runtime 2.0 `cloudfront` module swaps the origin directly.
- **Function URLs, not API Gateway.** Lambda and CloudFront both have permanent free tiers. HTTP API is free for 12 months only.
- **npm builder, not esbuild, for Node.** One file, one dependency, nothing to bundle.
- **Everything in us-east-1.** The CloudFront certificate has to be there anyway.

## Limits

- **GET only.** With OAC in front of a Function URL, a POST body needs an `x-amz-content-sha256` header computed by the client. Browsers will not send it, so POST is off until that is solved.
- pangu.go is assumed to publish `go.mod`, `pangu.SpacingText`, and `pangu.Version`.
