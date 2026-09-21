import { diffChars } from "./vendor/diff/character.js";
import pangu from "./vendor/pangu.js";

const ZH_TW = {
  // \u200B is the only place the headline may break, see word-break in styles.css
  title: "為什麼你們就是不能\u200B加個空格呢？",
  description: "自動在中文和英文、數字、符號之間插入空白",
  language: "語言",
  library: "函式庫",
  ai_spacing: "空格之神 AI",
  show_diff: "顯示差異",
  original: "原文",
  spaced: "加了空格之後",
  placeholder: "在這裡貼上或輸入文字",
  copy: "複製",
  copied: "已複製",
  added: "新增空格",
  removed: "移除空格",
  note: "除非你啟用空格之神 AI，否則沒有任何資料會被上傳到雲端。啟用之後，文字會送到 Cloudflare Workers AI，也可能留在紀錄裡。",
  status_copied: "已複製到剪貼簿",
  status_copy_failed: "複製失敗，請選取文字後手動複製",
  status_ai_asking: "正在請示空格之神",
  status_ai_done: "空格之神處理好了",
  status_ai_quota: "空格之神 AI 今天的免費額度用完了，UTC 00:00 重置",
  status_ai_failed: "空格之神 AI 暫時無法使用",
};

// English lives in the markup; only the status lines have no element of their own
const EN = {
  status_copied: "Copied to clipboard",
  status_copy_failed: "Copy failed. Select the text and copy it manually",
  status_ai_asking: "Thinking",
  status_ai_done: "AI spaced",
  status_ai_quota: "AI Spacing is out of free quota until 00:00 UTC",
  status_ai_failed: "AI Spacing is unavailable right now",
};

const AI_SPACING_URL = `${location.hostname === "localhost" ? "http://localhost:8787" : "https://api.pangu.space"}/text?feature=ai-spacing`;

const I18N_ATTRS = ["aria-label", "placeholder"];

const source = document.getElementById("source");
const diff = document.getElementById("diff");
const spaced = document.getElementById("spaced");
const legend = document.getElementById("legend");
const aiSpacing = document.getElementById("ai-spacing");
const aiStatus = document.getElementById("ai-status");
const aiProgress = document.getElementById("ai-progress");
const aiBar = document.getElementById("ai-bar");
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
    if (part.removed) {
      // Not drawn, so the row reads exactly as the output; the row tint is the only sign
      removed = true;
    } else if (part.added) {
      const mark = document.createElement("span");
      mark.className = "a";
      mark.textContent = part.value;
      row.append(mark);
      added = true;
    } else {
      row.append(part.value);
    }
  }
  row.className = added && removed ? "row mix" : added ? "row add" : removed ? "row del" : "row";
  return row;
}

function renderSpaced(text) {
  spacedText = text;
  spaced.value = spacedText;
  // Spacing never adds or removes a line break, so lines pair up by index
  const before = source.value.split("\n");
  diff.replaceChildren(...spacedText.split("\n").map((line, i) => renderRow(before[i], line)));
}

// Stays in the DOM like the progress status. The quota is expected and fixes itself, so only a failure reads as danger
function showAiStatus(key) {
  aiStatus.textContent = key ? messages[key] : "";
  aiStatus.classList.toggle("danger", key === "status_ai_failed");
}

let aiTimer;
let aiController;
let aiProgressTimer;

// The element stays in the DOM and only its text changes, or screen readers miss the announcement
function showAiProgress(key) {
  clearTimeout(aiProgressTimer);
  aiProgress.textContent = key ? messages[key] : "";
  aiProgress.classList.toggle("asking", key === "status_ai_asking");
  aiProgress.classList.toggle("done", key === "status_ai_done");
  aiBar.hidden = key !== "status_ai_asking";
}

// The rules' spacing stays on screen until the model answers, and for good when it fails
function requestAiSpacing() {
  clearTimeout(aiTimer);
  aiController?.abort();
  showAiProgress(null);
  if (!aiSpacing.checked) {
    showAiStatus(null);
    return;
  }
  // Longer than the render debounce, since every request can cost model calls
  aiTimer = setTimeout(async () => {
    aiController = new AbortController();
    // A fast answer shows nothing, so the status never flickers
    aiProgressTimer = setTimeout(() => showAiProgress("status_ai_asking"), 300);
    try {
      const response = await fetch(AI_SPACING_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source.value }),
        signal: aiController.signal,
      });
      if (response.ok) {
        const { text, candidates } = await response.json();
        renderSpaced(text);
        // An error stays up until an answer lands, so typing does not make it blink
        showAiStatus(null);
        // No candidates means the model was never asked
        showAiProgress(candidates.length > 0 ? "status_ai_done" : null);
        aiProgressTimer = setTimeout(() => showAiProgress(null), 1500);
        return;
      }
      showAiStatus(response.status === 429 ? "status_ai_quota" : "status_ai_failed");
    } catch (error) {
      // The newer request already owns the status
      if (error.name === "AbortError") {
        return;
      }
      showAiStatus("status_ai_failed");
    }
    showAiProgress(null);
  }, 800);
}

function render() {
  renderSpaced(pangu.spaceText(source.value));
  requestAiSpacing();
}

function spacedPane() {
  return showDiff.checked ? diff : spaced;
}

// Panes grow with their content, so only horizontal scroll needs syncing
// Skips the scroll event its own write fires, or a narrower pane would clamp the other one back
let syncedPane = null;
function syncScrollLeft(scrolled, follower) {
  if (scrolled === syncedPane) {
    syncedPane = null;
    return;
  }
  const scrollLeft = follower.scrollLeft;
  follower.scrollLeft = scrolled.scrollLeft;
  if (follower.scrollLeft !== scrollLeft) {
    syncedPane = follower;
  }
}

function applyShowDiff() {
  diff.hidden = !showDiff.checked;
  // Only the legend hides. The strip keeps its row, so nothing under the card jumps
  legend.hidden = !showDiff.checked;
  spaced.hidden = showDiff.checked;
  syncScrollLeft(source, spacedPane());
}

let renderTimer;
source.addEventListener("input", () => {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 150);
});

source.addEventListener("scroll", () => syncScrollLeft(source, spacedPane()));
for (const pane of [diff, spaced]) {
  pane.addEventListener("scroll", () => syncScrollLeft(pane, source));
}

aiSpacing.addEventListener("change", () => {
  save("aiSpacing", aiSpacing.checked);
  render();
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
aiSpacing.checked = load("aiSpacing") === "true";
showDiff.checked = load("showDiff") !== "false";
applyShowDiff();
render();
