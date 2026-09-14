# Gemini API free tier

Read from the AI Studio rate-limit page on 2026-09-15 with "Compare: Free tier" on, from a paid-tier project. The page shows the paid limit and the delta to Free tier, so Free tier = limit + delta. Where the paid limit is Unlimited, the page prints the Free tier number directly. A free-tier project would show the numbers straight.

| Model | RPM | TPM | RPD |
| --- | --- | --- | --- |
| Gemma 4 26B | 30 | 16K | 14.4K |
| Gemma 4 31B | 30 | 16K | 14.4K |
| Gemini 3.5 Flash Lite | 10 | 250K | 500 |
| Gemini 3.1 Flash Lite | 10 | 250K | 500 |
| Gemini 2.5 Flash Lite | 10 | 250K | 20 |
| Gemini 3.8 / 3.7 / 3.6 / 3.5 / 3 Flash | under 5, rounded away | 250K | 20 |
| Gemini 2.5 Flash | under 5, rounded away | 250K | 20 |
| Gemini Embedding 1 / 2 | 100 | 30K | 1K |
| Gemini 2.5 Pro, 3.1 Pro | 0 | 0 | 0 |
| Gemini 2 Flash, 2 Flash Lite | 0 | 0 | 0 |

RPM for the Flash rows is hidden by rounding: the delta prints as -20K against a 20K limit, so the free value is below 5 and unknown. Gemma 4 rows show no delta, so every tier shares 30 RPM / 16K TPM / 14.4K RPD.

What this means for the chain:

- Gemma 4 is the real free workhorse on Gemini: 14.4K requests/day, 30/min, and it is a Google-hosted open model, so it should sit ahead of the OpenRouter `:free` Gemma 4 entries
- Flash Lite 3.1 / 3.5 give 500/day at 10/min, good as the first accuracy step
- Every other Flash and both Pro models are 20/day or nothing on the free tier. Not chain material
- Free tier is still marked "used to improve our products" on the pricing page

ref:
https://aistudio.google.com/rate-limit
https://ai.google.dev/gemini-api/docs/pricing
