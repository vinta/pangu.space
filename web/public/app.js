import { diffChars } from "./vendor/diff/character.js";
import pangu from "./vendor/pangu.js";

const ZH_TW = {
  title: "為什麼你們就是不能加個空格呢？",
  description: "自動在中文和英文、數字、符號之間插入空白",
  language: "語言",
  library: "函式庫",
  ai_spacing: "空格之神 AI",
  show_diff: "顯示差異",
  original: "原文",
  spaced: "加了空格",
  placeholder: "在這裡貼上或輸入文字",
  copy: "複製",
  copied: "已複製",
  added: "新增空格",
  removed: "移除空格",
  note: "除非你啟用空格之神 AI，否則沒有任何資料會被上傳到雲端。",
  made_by: "作者",
  status_copied: "已複製到剪貼簿",
  status_copy_failed: "複製失敗，請選取文字後手動複製",
};

// English lives in the markup; only the two status lines have no element of their own
const EN = {
  status_copied: "Copied to clipboard",
  status_copy_failed: "Copy failed. Select the text and copy it manually",
};

const I18N_ATTRS = ["aria-label", "placeholder"];

const source = document.getElementById("source");
const diff = document.getElementById("diff");
const spaced = document.getElementById("spaced");
const strip = document.getElementById("strip");
const showDiff = document.getElementById("show-diff");
const copy = document.getElementById("copy");
const status = document.getElementById("status");
const lang = document.getElementById("lang");

let messages = EN;
let spacedText = "";

// localStorage throws in private windows and when site data is blocked
function load(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function collectEnglish() {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    EN[el.dataset.i18n] = el.textContent;
  }
  for (const attr of I18N_ATTRS) {
    for (const el of document.querySelectorAll(`[data-i18n-${attr}]`)) {
      EN[el.getAttribute(`data-i18n-${attr}`)] = el.getAttribute(attr);
    }
  }
}

function applyLanguage(code) {
  messages = code === "zh-TW" ? ZH_TW : EN;
  document.documentElement.lang = code;
  lang.value = code;
  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.textContent = messages[el.dataset.i18n];
  }
  for (const attr of I18N_ATTRS) {
    for (const el of document.querySelectorAll(`[data-i18n-${attr}]`)) {
      el.setAttribute(attr, messages[el.getAttribute(`data-i18n-${attr}`)]);
    }
  }
}

// diffChars can blame a neighbor character for a moved space: "( a" to " (a" marks the paren
// Returns null when more than whitespace changed (a colon turned full-width), so the caller falls back
function whitespaceParts(before, after) {
  const parts = [];
  const push = (value, added, removed) => {
    const last = parts.at(-1);
    if (last && last.added === added && last.removed === removed) {
      last.value += value;
    } else {
      parts.push({ value, added, removed });
    }
  };
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (before[i] === after[j]) {
      push(after[j], false, false);
      i++;
      j++;
    } else if (j < after.length && /\s/.test(after[j])) {
      push(after[j++], true, false);
    } else if (i < before.length && /\s/.test(before[i])) {
      push(before[i++], false, true);
    } else {
      return null;
    }
  }
  return parts;
}

function renderRow(before, after) {
  const row = document.createElement("div");
  let added = false;
  let removed = false;
  for (const part of whitespaceParts(before, after) ?? diffChars(before, after)) {
    if (part.added || part.removed) {
      const mark = document.createElement("span");
      mark.className = part.added ? "a" : "d";
      mark.textContent = part.value;
      row.append(mark);
      added ||= part.added;
      removed ||= part.removed;
    } else {
      row.append(part.value);
    }
  }
  row.className = added && removed ? "row mix" : added ? "row add" : removed ? "row del" : "row";
  return row;
}

function render() {
  spacedText = pangu.spaceText(source.value);
  spaced.value = spacedText;
  // spaceText never adds or removes a line break, so lines pair up by index
  const before = source.value.split("\n");
  diff.replaceChildren(...spacedText.split("\n").map((line, i) => renderRow(before[i], line)));
}

function applyShowDiff() {
  diff.hidden = !showDiff.checked;
  strip.hidden = !showDiff.checked;
  spaced.hidden = showDiff.checked;
}

let renderTimer;
source.addEventListener("input", () => {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 150);
});

showDiff.addEventListener("change", () => {
  save("showDiff", showDiff.checked);
  applyShowDiff();
});

lang.addEventListener("change", () => {
  save("lang", lang.value);
  applyLanguage(lang.value);
});

let copiedTimer;
copy.addEventListener("click", async () => {
  clearTimeout(copiedTimer);
  // Emptied first, so a repeated message is announced again
  status.textContent = "";
  try {
    await navigator.clipboard.writeText(spacedText);
  } catch {
    copy.classList.remove("copied");
    status.textContent = messages.status_copy_failed;
    return;
  }
  copy.classList.add("copied");
  status.textContent = messages.status_copied;
  copiedTimer = setTimeout(() => copy.classList.remove("copied"), 2000);
});

collectEnglish();
applyLanguage(load("lang") ?? (navigator.languages.some((code) => code.toLowerCase().startsWith("zh")) ? "zh-TW" : "en"));
showDiff.checked = load("showDiff") !== "false";
applyShowDiff();
render();
