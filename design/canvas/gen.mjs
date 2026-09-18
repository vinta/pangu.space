import { readFileSync, writeFileSync } from "node:fs";

const SANS = `-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", "PingFang TC", "Noto Sans TC", "Noto Sans", sans-serif`;

const DIRS = {
  StyleQ: { name: "Q · P + neutral ink (Apple)", vars: {
    bg: "#ffffff", mainBg: "#fafafa", surface: "#ffffff", surface2: "#fafafa", border: "#e5e5e7", border2: "#f5f5f7",
    text: "#1d1d1f", text2: "#6e6e73", text3: "#a1a1a6", accent: "#3b82f6", track: "#dbeafe", knob: "#3b82f6", trackOff: "#f3f4f6",
    add: "#86efac", del: "#fca5a5", rowAdd: "#dcfce7", rowDel: "#fee2e2", rowMix: "#fef9c3",
    radius: "12px", radiusSm: "8px", radiusXs: "6px", bw: "1px", cardBorder: "1px solid #e5e5e7", cardShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
    font: SANS, fontPane: SANS, paneSize: "16px", fontHero: SANS, heroSize: "40px", heroWeight: "600", heroSpacing: "0",
    navBg: "#ffffff", paneHeadBg: "transparent", markRadius: "2px", labelSize: "14px",
  }},
  StyleP: { name: "P · Picked: A + F hero/bg + D diff + popup toggle", vars: {
    bg: "#ffffff", mainBg: "#fafafa", surface: "#ffffff", surface2: "#f9fafb", border: "#e5e7eb", border2: "#f3f4f6",
    text: "#111827", text2: "#6b7280", text3: "#9ca3af", accent: "#3b82f6", track: "#dbeafe", knob: "#3b82f6", trackOff: "#f3f4f6",
    add: "#86efac", del: "#fca5a5", rowAdd: "#dcfce7", rowDel: "#fee2e2", rowMix: "#fef9c3",
    radius: "12px", radiusSm: "8px", radiusXs: "6px", bw: "1px", cardBorder: "1px solid #e5e7eb", cardShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
    font: SANS, fontPane: SANS, paneSize: "16px", fontHero: SANS, heroSize: "40px", heroWeight: "600", heroSpacing: "-0.04em",
    navBg: "#ffffff", paneHeadBg: "transparent", markRadius: "2px",
  }},
};

const BASE = { labelFont: "inherit", labelSize: "13px", labelSpacing: "0", paneSpacing: "0", bodySpacing: "0", heroTop: "48px", transitionFast: "150ms cubic-bezier(0.4, 0, 0.2, 1)", transition: "200ms cubic-bezier(0.4, 0, 0.2, 1)" };
for (const d of Object.values(DIRS)) { d.vars = { ...BASE, ...d.vars }; d.vars.trackOff ??= d.vars.border2; d.vars.mainBg ??= d.vars.bg; }
const tpl = readFileSync("template.html", "utf8");
const PHONE = readFileSync("phone.css", "utf8");
DIRS.PhoneQ = { name: "Phone · Q", w: 390, h: 1300, phone: true, vars: DIRS.StyleQ.vars };
for (const [file, d] of Object.entries(DIRS)) {
  const css = Object.entries(d.vars).map(([k, v]) => `      --${k}: ${v};`).join("\n");
  writeFileSync(`project/${file}.dc.html`, tpl.replace("@@VARS@@", css).replaceAll("@@W@@", String(d.w ?? 1280)).replaceAll("@@H@@", String(d.h ?? 900)).replace("@@EXTRA@@", d.phone ? PHONE : ""));
}

const idx = JSON.parse(readFileSync("canvas-index.json", "utf8"));
const pos = { StyleQ: [0, 2050], PhoneQ: [1360, 2050], StyleP: [1830, 2050] };
for (const [file, d] of Object.entries(DIRS)) {
  idx.boards[`${file}.dc.html`] = { x: pos[file][0], y: pos[file][1], w: d.w ?? 1280, h: d.h ?? 900, title: d.name, is_interactive: true };
  if (!idx.order.includes(`${file}.dc.html`)) idx.order.push(`${file}.dc.html`);
}
idx.notes.t4 = { kind: "title1", maxW: 3110, text: "Picked · Style Q, with the earlier pick P", w: 240, x: 0, y: 1750 };
idx.notes.n7 = { color: "blue", w: 320, x: 3190, y: 2550, text: "A as base. Hero from F (40px, 600, -0.04em). Main background #fafafa from F, navbar stays white. Diff colors from D (#86efac / #fca5a5 marks, #dcfce7 / #fee2e2 / #fef9c3 rows). Disabled toggle as the extension popup: track #f3f4f6, white knob, label #6b7280, no fade. Shell max-width 1280px, fluid below." };
idx.notes.n8 = { color: "green", w: 320, x: 3190, y: 2050, text: "Q = P with two changes from developer.apple.com/design. Neutral ink: text #1d1d1f, secondary #6e6e73, light fill #f5f5f7 (read from their CSS); border #e5e5e7 and tertiary #a1a1a6 are derived to match. Hero letter-spacing started at -0.02em and was dropped later: negative tracking squeezes Chinese glyphs. Blue accent, diff colors, toggle unchanged." };
writeFileSync("project/canvas.json", JSON.stringify(idx, null, 2) + "\n");
