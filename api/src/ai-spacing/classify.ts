import type { Candidate, CandidateLabel } from "./candidate";
import type { PromptSpec } from "./shapes/base";

// See docs/research/2026-09-16-llm-provider-eval/llm-provider-eval.md
export const MODEL = "@cf/google/gemma-4-26b-a4b-it";

const GATEWAY_ID = "pangu-space";

// A call can stall for tens of seconds, and a request waits for its slowest candidate
const TIMEOUT_MS = 5000;

// Workers AI error 3036: the daily free allocation is used up until 00:00 UTC. The docs give the code and the message but not what the binding throws, so match either
// https://developers.cloudflare.com/workers-ai/platform/errors/
const ACCOUNT_LIMITED = /\b3036\b|daily free allocation/i;

export class AiQuotaExceededError extends Error {}

// The prompts ask for the option name alone, so anything beyond the bare label is a miss
function parseCandidateLabel<Label extends string>(raw: string, candidateLabels: readonly Label[]) {
  const cleaned = raw
    .trim()
    .replace(/^[^a-z]+|[^a-z]+$/gi, "")
    .toLowerCase();
  return candidateLabels.find((candidateLabel) => candidateLabel === cleaned) ?? null;
}

// A null is a failure, not an answer: the candidate keeps the spacing the rules gave it
export async function classifyOneCandidate(ai: Ai, promptSpec: PromptSpec<CandidateLabel>, candidate: Candidate) {
  try {
    const output = await ai.run(
      MODEL,
      {
        messages: [
          { role: "system", content: promptSpec.systemPrompt },
          { role: "user", content: promptSpec.buildQuestion(candidate.sentence, candidate.at) },
        ],
        temperature: 0,
        // Thinking costs 5 seconds and about 4x the neurons to pick one label
        chat_template_kwargs: { enable_thinking: false },
      },
      { gateway: { id: GATEWAY_ID }, signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    const raw = output.choices[0]?.message.content ?? "";
    const candidateLabel = parseCandidateLabel(raw, promptSpec.candidateLabels);
    if (candidateLabel === null) {
      console.warn({ message: "answer outside the candidate labels", kind: promptSpec.kind, promptVersion: promptSpec.version, raw });
    }
    return candidateLabel;
  } catch (error) {
    // Workers Logs indexes object fields. The sentence stays out of the log, since it is user text
    console.error({ message: "classify failed", kind: promptSpec.kind, promptVersion: promptSpec.version, error: String(error) });
    if (ACCOUNT_LIMITED.test(String(error))) {
      throw new AiQuotaExceededError();
    }
    return null;
  }
}
