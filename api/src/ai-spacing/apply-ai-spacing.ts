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

// The rules space first, then the model only relabels the symbols the rules had to guess at
export async function applyAiSpacing(unspaced: string, classifyOneCandidate: (promptSpec: PromptSpec<CandidateLabel>, candidate: Candidate) => Promise<CandidateLabel | null>) {
  const settled = pangu.spaceText(unspaced);
  const classified = await Promise.all(
    SHAPES.flatMap(({ ambiguousShape, promptSpec }) =>
      ambiguousShape.find(unspaced, settled).map(async (candidateMatch) => ({
        ambiguousShape,
        candidateMatch,
        candidateLabel: await classifyOneCandidate(promptSpec, candidateMatch),
      })),
    ),
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
