# LLM provider eval

First run of `eval/eval.mjs` on 2026-09-16, asking two questions: which gateway to integrate with, and which model classifies better. Only the first got an answer.

## What was run

The eval sends pangu.js's shipping AI-spacing prompts to a hosted model over the OpenAI chat-completions API and scores the answers against the pangu.js corpora. Nothing is vendored: it imports `hyphenDigitPrompt` and `digitPlusPrompt` straight from the extension source and reads the corpus JSON from the same repo, so a prompt bump there shows up here without a copy step.

60 scored cases in two corpora: 53 hyphen-digit (`v29-zh`) and 7 digit-plus (`v18-en-real-examples`). One call per case, `temperature: 0`, no structured output. The prompts already ask for the option name alone, so the answer is parsed as plain text and matched against the label enum after trimming quotes and punctuation.

| experiment | target | passed | avg ms |
| --- | --- | --- | --- |
| hyphen-digit | `workers-ai:@cf/google/gemma-4-26b-a4b-it` | 53/53 | 5806 |
| digit-plus | `workers-ai:@cf/google/gemma-4-26b-a4b-it` | 7/7 | 5522 |
| digit-plus | `openrouter:nvidia/nemotron-3.5-lightning:free` | 7/7 | 20761 |

## The corpus is saturated

Gemma 4 answered all 60 cases correctly on the first try, with no errors and no prompt changes.

That is not a model verdict, it is a ceiling. These cases exist because Gemini Nano failed them: they were collected during prompt rounds as a Nano-difficulty ladder, and every one of them has a label Nano got wrong at some point. A cloud model walks up that ladder without stumbling. The next model tried will most likely also score 60/60, and a tie ranks nothing.

So "which model performs better" cannot be measured on this corpus. Answering it needs harder cases: either text where the shipping prompts stay ambiguous to any model, or the ambiguous shapes [ADR 0016](../../../pangu.js/docs/adr/0016-hyphen-before-digit-gets-a-model-layer.md) deferred — filename-versus-mention, formula-versus-prose, brand suffixes — which failed the zero-regression bar on Nano and have never been tried on anything stronger.

## Which gateway: Workers AI

Not on accuracy, which does not discriminate. On the constraints that bind.

| | Workers AI | OpenRouter free |
| --- | --- | --- |
| Daily budget | 10,000 neurons | 50 requests |
| One eval pass (60 calls) | fits many times over | does not fit once |
| Gemma 4 on 2026-09-16 | answers | 429, throttled upstream |
| Latency | 5.5-5.8s | 20.8s |

OpenRouter free cannot run this eval a single time, which rules it out of the development loop whatever its models score. The 50/day cap lifts to 1,000/day after a one-time $10 purchase; that was not tested.

Gemma 4 is also unavailable on OpenRouter's free tier right now. Both `google/gemma-4-26b-a4b-it:free` and `google/gemma-4-31b-it:free` return `429 temporarily rate-limited upstream` naming Google AI Studio, because OpenRouter forwards to Google and Google throttles. Workers AI serves its own copy and answered immediately. The planned same-model-two-routes comparison was therefore not possible; the two rows above run different models and are not comparable on accuracy.

Three OpenRouter free models did answer a probe: `nvidia/nemotron-3.5-lightning:free`, `nex-agi/nex-n2.5-pro:free`, `inclusionai/ling-3.0-flash-fin:free`.

## Latency is the real problem

Nobody asked about latency and it is the finding that matters most. 5.8s per candidate, called sequentially, means a paragraph with 5 ambiguous symbols takes a 29-second API response. That is not shippable behind `GET /text`.

Gemma 4 is a reasoning model. A probe returns `reasoning` as a populated field next to `content`, so most of those 5.8s is reasoning tokens generated before a one-word answer. Two ways out, and they are the two questions the blindspot pass already left open:

- Batch every candidate into one call instead of one call each. Changes the prompt contract, so it needs re-evaluation, and trades away the per-candidate isolation [ADR 0017](../../../pangu.js/docs/adr/0017-ai-spacing-policy-stays-in-the-extension.md) chose.
- Pick a non-reasoning model. Accuracy no longer discriminates, so latency is free to be the selection criterion. `@cf/meta/llama-3.1-8b-instruct-fp8` is the obvious next probe.

## Notes on the setup

Workers AI is reached at `/accounts/{account_id}/ai/v1/chat/completions`, its own OpenAI-compatible path, with `cf-aig-gateway-id` pointing at the AI Gateway so calls land in gateway analytics. Workers AI and AI Gateway are separate products: the gateway is a proxy with logging, caching and rate limiting, and holds no models. Dropping the header still works and only loses the analytics.

No BYOK provider key is needed for `@cf/` models, which draw the free neuron allocation. That matters, because on the gateway's compat endpoint a missing `default` BYOK key does not fail the request, it falls through to Unified Billing, which is prepaid credit. `@cf/` models avoid that path entirely.

The Cloudflare token needs AI Gateway Run plus Workers AI Read and Edit. Read alone can 403.

ref:
https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
https://developers.cloudflare.com/ai-gateway/usage/providers/workersai/
https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/
https://developers.cloudflare.com/workers-ai/get-started/rest-api/
https://openrouter.ai/docs/faq
