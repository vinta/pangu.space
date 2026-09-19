import pangu from "pangu";
import { describe, expect, it } from "vitest";
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
