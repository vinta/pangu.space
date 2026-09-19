import type { DigitPlusLabel } from './shapes/digit-plus-prompt';
import type { HyphenDigitLabel } from './shapes/hyphen-digit-prompt';

// One flagged symbol. `at` is its index inside `sentence`, since a sentence can carry the same symbol twice
export interface Candidate {
  sentence: string;
  at: number;
}

export type CandidateLabel = HyphenDigitLabel | DigitPlusLabel;
