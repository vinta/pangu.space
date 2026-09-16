# LLM provider eval

Runs of `eval.mjs` on 2026-09-16, asking which gateway to integrate with and which model classifies better. The gateway question has an answer. The model question turned out to be two questions, and the useful one was never about size.

## What was run

The eval sends pangu.js's shipping AI-spacing prompts to a hosted model over the OpenAI chat-completions API and scores the answers against the pangu.js corpora. Nothing is vendored: it imports `hyphenDigitPrompt` and `digitPlusPrompt` straight from the extension source and reads the corpus JSON from the same repo, so a prompt bump there shows up here without a copy step.

60 scored cases in two corpora: 53 hyphen-digit (`v29-zh`) and 7 digit-plus (`v18-en-real-examples`). One call per case, `temperature: 0`, no structured output. The prompts already ask for the option name alone, so the answer is parsed as plain text and matched against the label enum after trimming quotes and punctuation.

## Which gateway: Workers AI

Not on accuracy, which does not discriminate at the top. On the constraints that bind.

| | Workers AI | OpenRouter free |
| --- | --- | --- |
| Daily budget | 10,000 neurons | 50 requests |
| One eval pass (60 calls) | fits many times over | does not fit once |
| Gemma 4 on 2026-09-16 | answers | 429, throttled upstream |
| Latency | 0.7-5.8s | 20.8s |

OpenRouter free cannot run this eval a single time, which rules it out of the development loop whatever its models score. The 50/day cap lifts to 1,000/day after a one-time $10 purchase; that was not tested.

Gemma 4 is also unavailable on OpenRouter's free tier right now. Both `google/gemma-4-26b-a4b-it:free` and `google/gemma-4-31b-it:free` return `429 temporarily rate-limited upstream` naming Google AI Studio, because OpenRouter forwards to Google and Google throttles. Workers AI serves its own copy and answered immediately. The planned same-model-two-routes comparison was therefore not possible.

Three OpenRouter free models did answer a probe: `nvidia/nemotron-3.5-lightning:free` (7/7 on digit-plus, 20.8s per call), `nex-agi/nex-n2.5-pro:free`, `inclusionai/ling-3.0-flash-fin:free`.

## Which model: Gemma 4 with thinking off

`@cf/google/gemma-4-26b-a4b-it` with `chat_template_kwargs: { enable_thinking: false }`. 59/60 at 770ms per call.

| model | think | hyphen-digit | digit-plus | signed-number | avg ms |
| --- | --- | --- | --- | --- | --- |
| gemma-4-26b-a4b | on | 53/53 | 7/7 | 16/16 | 5806 |
| **gemma-4-26b-a4b** | **off** | **52/53** | **7/7** | **16/16** | **770** |
| qwen3-30b-a3b | on | 53/53 | 7/7 | 16/16 | 3277 |
| qwen3-30b-a3b | off | 0/53 | 0/7 | 0/16 | broken |
| glm-4.7-flash | on | 49/53 (2 errors) | 7/7 | 13/16 | 26518 |
| glm-4.7-flash | off | 46/53 | 6/7 | 9/16 | 1149 |
| granite-4.0-h-micro | on | 42/53 | 7/7 | 5/16 | 1129 |
| llama-3.1-8b-fp8 | on | 38/53 | 6/7 | 1/16 | 918 |
| llama-3.2-3b | on | 37/53 | 6/7 | 0/16 | 422 |
| llama-3.2-1b | on | 17/53 | 6/7 | 15/16 | 582 |

Read `signed-number` before the totals. It is the 16 cases where the hyphen is a real minus sign, and the only class where the model changes the output: `signed-number` removes a space, every other label leaves core's spacing alone. A model that never picks it is a model that does nothing. llama-3.2-1b's 15/16 there is an artifact of answering `signed-number` for nearly everything, which is why it takes 2/37 on the other class.

## The corpus is saturated at the top and discriminates at the bottom

Gemma 4 and Qwen 3 answer all 60 cases correctly with no prompt changes. That is a ceiling, not a verdict: these cases were collected because Gemini Nano failed them, so they form a Nano-difficulty ladder that a capable cloud model walks up without stumbling.

The ladder still works at the small end, which is what made the size question answerable. Every dense model under 8B collapses to a single label and scores by whichever class is larger.

## Dense versus MoE, not big versus small

The failure is not gradual. llama-3.2-3b takes 0/16 on `signed-number`; llama-3.1-8b is 2.7 times larger and takes 1/16. Scaling dense models through that range buys one case. The jump to working is a cliff between 8B and 26B, so there is no "slightly bigger model" option to trade latency against.

What separates the working models from the broken ones is architecture. Both `gemma-4-26b-a4b` (4B active of 26B) and `qwen3-30b-a3b` (3B active of 30B) are mixture-of-experts, and both score 60/60. `qwen3-30b-a3b` has fewer active parameters than `llama-3.1-8b` and beats it 53/53 to 38/53. Active parameters set the speed, total parameters set the quality, and MoE decouples them.

That kills the premise of the size sweep. The best model is also nearly the fastest: Gemma 4 with thinking off runs 770ms, faster than llama-3.1-8b at 918ms and granite at 1129ms, while scoring 59/60 against their 44/60 and 49/60.

## Thinking costs one case and 5 seconds

Turning thinking off on Gemma 4 loses exactly one hyphen-digit case (`real-development-10`) and keeps `signed-number` at 16/16. It cuts the call from 5806ms to 770ms, a 7.5x speedup, because the task is picking one of three labels and never needed reasoning tokens.

More thinking is not better. glm-4.7-flash with thinking on spends 33,823 completion tokens across 53 cases, roughly 640 tokens per three-word answer, takes 26.5 seconds per call, throws two errors, and still only reaches 49/53.

`chat_template_kwargs.enable_thinking` is not portable. It is documented on Gemma 4 and works there. On `qwen3-30b-a3b` it does not disable thinking, it breaks the response: `content` comes back `null` and a stub lands in `reasoning`, which scores 0/60 with no error raised. Check `content` is non-empty after changing models.

## Cost

One full 60-case pass on Gemma 4 with thinking off is about 18.6k prompt and 311 completion tokens, roughly 178 neurons. The free allocation of 10,000 neurons per day is about 56 full passes.

In production the number that matters is per candidate: roughly 3 neurons, so about 3,300 classifications per day free. That, not the token counts, is what the drain premortem should be sized against. One 1,500-character GET can hold 500 candidates.

## Which endpoint

Use `/accounts/{account_id}/ai/v1/chat/completions`, Cloudflare's OpenAI-compatible REST path. Two reasons, and the second was a surprise.

The gateway's own proxy at `gateway.ai.cloudflare.com/v1/{account_id}/{gateway}/compat/chat/completions` is deprecated for this use: "For standard single-model chat completions, this endpoint is deprecated. Use the REST API instead". It survives only for dynamic routes, which the REST API does not cover.

And the REST path already routes to third-party providers, so there is nothing to migrate to later. Probed on 2026-09-16:

| model string | result |
| --- | --- |
| `@cf/google/gemma-4-26b-a4b-it` | 200 |
| `google/gemini-2.5-flash` | 402 `Insufficient balance; add money to your gateway or use BYOK` |
| `openai/gpt-5.2` | 402, same |
| `anthropic/claude-4-5-sonnet` | 404 model not found, but the model name was guessed |
| `workers-ai/@cf/google/gemma-4-26b-a4b-it` | 404 model not found |

A 402 means routing worked and stopped at the billing check. Adding a BYOK key for that provider is the whole migration: same URL, same headers, same client code, one different model string.

Model naming is not portable between the two paths. On the REST path Workers AI models are bare `@cf/...` and the `workers-ai/` prefix 404s; on the compat proxy both forms answer.

Unified Billing fails closed. A third-party model with no BYOK key and no gateway balance returns 402 rather than silently charging, so a zero balance is its own spend limit. The risk only appears after adding gateway credit.

## Notes on the setup

Workers AI and AI Gateway are separate products: the gateway is a proxy with logging, caching and rate limiting, and holds no models. It is optional and provider-agnostic, not Workers AI's front door.

`cf-aig-gateway-id` attaches the gateway to a REST call for analytics without proxying it. That costs about 90ms median, measured paired over 53 cases with the same model and prompts, alternating order: 608ms direct against 700ms with the header, slower in 41 of 53 cases. The compat proxy measured 788ms median but was slower in only 31 of 53, which is inside the noise.

Ignore means on any of these. One unproxied call stalled for 42.7 seconds and inverted the averages by itself. The tail is far fatter than a 770ms average suggests, which matters when picking a timeout.

No BYOK provider key is needed for `@cf/` models, which draw the free neuron allocation.

The Cloudflare token needs AI Gateway Run plus Workers AI Read and Edit. Read alone can 403. Reading gateway logs needs AI Gateway Read as well; without it the logs API returns 403 and the dashboard is the only view.

## Open

- `real-development-10`, the single case thinking-off loses. Not yet inspected.
- Batching every candidate into one call, the other latency lever. Untested.
- Whether any model separates from the others needs harder cases: text where the shipping prompts stay ambiguous, or the shapes [ADR 0016](../../../../pangu.js/docs/adr/0016-hyphen-before-digit-gets-a-model-layer.md) deferred, which failed the zero-regression bar on Nano and have never been tried on anything stronger.
- The prompts are Nano-tuned and Nano is roughly 3B-class, yet `llama-3.2-3b` scores 0/16 on `signed-number` at the same size. Same size, opposite outcome, so the small-model failures here are model-specific rather than a size limit. Optimizing prompts for a small model would buy nothing for pangu.space, since Gemma 4 is already faster and better, but it is the one result that would justify a prompt experiment for its own sake.

ref:
https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/
https://developers.cloudflare.com/ai-gateway/usage/providers/workersai/
https://developers.cloudflare.com/ai-gateway/usage/chat-completion/
https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/
https://developers.cloudflare.com/workers-ai/get-started/rest-api/
https://openrouter.ai/docs/faq
