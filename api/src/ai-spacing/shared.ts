// Vendored from pangu.js src/shared/index.ts at b558b0d1, which npm pangu does not export. find() must flag with the same regexes spaceText() applies, so re-copy when the pinned pangu version changes
// TODO: drop this file once pangu.js ships a `pangu/shared` export with CJK and DIGIT_PLUS_CJK

export const CJK_RADICALS_SUPPLEMENT = '\u2e80-\u2eff';
export const KANGXI_RADICALS = '\u2f00-\u2fdf';
export const HIRAGANA = '\u3040-\u309f';
export const KATAKANA_NO_MIDDLE_DOT = '\u30a0-\u30fa\u30fc-\u30ff'; // The Katakana block ends at \u30ff, but \u30fb is the character that MIDDLE_DOT normalizes to, so it must not read as CJK itself
export const BOPOMOFO = '\u3100-\u312f';
export const ENCLOSED_CJK_LETTERS_AND_MONTHS = '\u3200-\u32ff';
export const CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A = '\u3400-\u4dbf';
export const CJK_UNIFIED_IDEOGRAPHS = '\u4e00-\u9fff';
export const CJK_COMPATIBILITY_IDEOGRAPHS = '\uf900-\ufaff';

export const CJK = `${CJK_RADICALS_SUPPLEMENT}${KANGXI_RADICALS}${HIRAGANA}${KATAKANA_NO_MIDDLE_DOT}${BOPOMOFO}${ENCLOSED_CJK_LETTERS_AND_MONTHS}${CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A}${CJK_UNIFIED_IDEOGRAPHS}${CJK_COMPATIBILITY_IDEOGRAPHS}`;

export const DIGIT_PLUS_CJK = new RegExp(`\\b([0-9]+)(\\+)([${CJK}])`, 'g');
