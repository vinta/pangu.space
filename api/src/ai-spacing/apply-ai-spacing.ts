import pangu from "pangu";
import type { Candidate, CandidateLabel } from "./candidate";
import type { PromptSpec } from "./shapes/base";
import { applyTextEdits } from "./shapes/base";
import { digitPlus } from "./shapes/digit-plus";
import { digitPlusPrompt } from "./shapes/digit-plus-prompt";
import { hyphenDigit } from "./shapes/hyphen-digit";
import { hyphenDigitPrompt } from "./shapes/hyphen-digit-prompt";

const SHAPES = [
  { ambiguousShape: hyphenDigit, promptSpec: hyphenDigitPrompt },
  { ambiguousShape: digitPlus, promptSpec: digitPlusPrompt },
];

export const PROMPT_VERSIONS = Object.fromEntries(SHAPES.map(({ promptSpec }) => [promptSpec.kind, promptSpec.version]));

// One candidate is one LLM call, so an unbounded paste can spend the whole daily neuron quota by itself. Dense real text runs about one candidate per 8 characters
export const MAX_CANDIDATES = 20;

export class TooManyCandidatesError extends Error {
  constructor(readonly candidateCount: number) {
    super();
  }
}

// The rules space first, then the model only relabels the symbols the rules had to guess at
export async function applyAiSpacing(unspaced: string, classifyOneCandidate: (promptSpec: PromptSpec<CandidateLabel>, candidate: Candidate) => Promise<CandidateLabel | null>) {
  const settled = pangu.spaceText(unspaced);
  const flagged = SHAPES.flatMap(({ ambiguousShape, promptSpec }) => ambiguousShape.find(unspaced, settled).map((candidateMatch) => ({ ambiguousShape, promptSpec, candidateMatch })));
  if (flagged.length > MAX_CANDIDATES) {
    throw new TooManyCandidatesError(flagged.length);
  }
  const classified = await Promise.all(
    flagged.map(async ({ ambiguousShape, promptSpec, candidateMatch }) => ({
      ambiguousShape,
      candidateMatch,
      candidateLabel: await classifyOneCandidate(promptSpec, candidateMatch),
    })),
  );
  const textEdits = classified.flatMap(({ ambiguousShape, candidateMatch, candidateLabel }) => ambiguousShape.edits({ ...candidateMatch, settled }, candidateLabel));
  return {
    text: applyTextEdits(settled, textEdits),
    candidates: classified.map(({ ambiguousShape, candidateMatch, candidateLabel }) => ({
      kind: ambiguousShape.kind,
      sentence: candidateMatch.sentence,
      at: candidateMatch.at,
      label: candidateLabel,
    })),
  };
}
