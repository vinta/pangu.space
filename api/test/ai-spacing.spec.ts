import pangu from "pangu";
import { describe, expect, it, vi } from "vitest";
import { applyAiSpacing, MAX_CANDIDATES, TooManyCandidatesError } from "../src/ai-spacing/apply-ai-spacing";
import { applyTextEdits } from "../src/ai-spacing/shapes/base";
import { digitPlus } from "../src/ai-spacing/shapes/digit-plus";
import { hyphenDigit } from "../src/ai-spacing/shapes/hyphen-digit";

// Runs against real spaceText() output, so a vendored regex that drifts from the pinned pangu build fails here
describe("vendored ambiguous shapes", () => {
  it("removes the gap after a signed-number hyphen", () => {
    const unspaced = "女朋友今天的氣溫是-273.15度";
    const settled = pangu.spaceText(unspaced);
    const candidateMatches = hyphenDigit.find(unspaced, settled);
    expect(candidateMatches).toEqual([{ sentence: unspaced, at: 9, index: 10 }]);
    const textEdits = hyphenDigit.edits({ ...candidateMatches[0]!, settled }, "signed-number");
    expect(applyTextEdits(settled, textEdits)).toBe("女朋友今天的氣溫是 -273.15 度");
  });

  it("adds the gap before a conjunction plus", () => {
    const unspaced = "煮過頭2+資料片超棒";
    const settled = pangu.spaceText(unspaced);
    const candidateMatches = digitPlus.find(unspaced, settled);
    expect(candidateMatches).toEqual([{ sentence: unspaced, at: 4, index: 5 }]);
    const textEdits = digitPlus.edits({ ...candidateMatches[0]!, settled }, "conjunction");
    expect(applyTextEdits(settled, textEdits)).toBe("煮過頭 2 + 資料片超棒");
  });

  it("leaves the settled text alone on a null label", () => {
    const unspaced = "女朋友今天的氣溫是-273.15度";
    const settled = pangu.spaceText(unspaced);
    const [candidateMatch] = hyphenDigit.find(unspaced, settled);
    expect(hyphenDigit.edits({ ...candidateMatch!, settled }, null)).toEqual([]);
  });
});

describe("applyAiSpacing", () => {
  const unspaced = "今天-5度，買2+資料片";

  it("applies each shape's label on top of the rules", async () => {
    const result = await applyAiSpacing(unspaced, async (promptSpec) => (promptSpec.kind === "hyphen-digit" ? "signed-number" : "conjunction"));
    expect(result).toEqual({
      text: "今天 -5 度，買 2 + 資料片",
      candidates: [
        { kind: "hyphen-digit", sentence: unspaced, at: 2, label: "signed-number" },
        { kind: "digit-plus", sentence: unspaced, at: 8, label: "conjunction" },
      ],
    });
  });

  it("keeps the rules' spacing on null labels", async () => {
    const { text } = await applyAiSpacing(unspaced, async () => null);
    expect(text).toBe(pangu.spaceText(unspaced));
  });

  it("classifies a text sitting on the candidate cap", async () => {
    const classifyOneCandidate = vi.fn(async () => null);
    await applyAiSpacing("今天-5度，".repeat(MAX_CANDIDATES), classifyOneCandidate);
    expect(classifyOneCandidate).toHaveBeenCalledTimes(MAX_CANDIDATES);
  });

  it("classifies nothing past the candidate cap", async () => {
    const classifyOneCandidate = vi.fn(async () => null);
    await expect(applyAiSpacing("今天-5度，".repeat(MAX_CANDIDATES + 1), classifyOneCandidate)).rejects.toThrow(TooManyCandidatesError);
    expect(classifyOneCandidate).not.toHaveBeenCalled();
  });
});
