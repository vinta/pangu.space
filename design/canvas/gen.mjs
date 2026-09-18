import { readFileSync, writeFileSync } from "node:fs";

const SANS = `-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", "PingFang TC", "Noto Sans TC", "Noto Sans", sans-serif`;
const MONO = `ui-monospace, "SF Mono", Menlo, Consolas, "PingFang TC", "Noto Sans TC", monospace`;
const SERIF = `"Iowan Old Style", "Palatino Linotype", Georgia, "Noto Serif TC", "PingFang TC", serif`;

const DIRS = {
  StyleQ: { name: "Q · P + neutral ink (Apple) + hero -0.02em", vars: {
    bg: "#ffffff", mainBg: "#fafafa", surface: "#ffffff", surface2: "#fafafa", border: "#e5e5e7", border2: "#f5f5f7",
    text: "#1d1d1f", text2: "#6e6e73", text3: "#a1a1a6", accent: "#3b82f6", track: "#dbeafe", knob: "#3b82f6", trackOff: "#f3f4f6",
    add: "#86efac", del: "#fca5a5", rowAdd: "#dcfce7", rowDel: "#fee2e2", rowMix: "#fef9c3",
    radius: "12px", radiusSm: "8px", radiusXs: "6px", bw: "1px", cardBorder: "1px solid #e5e5e7", cardShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
    font: SANS, fontPane: SANS, paneSize: "16px", fontHero: SANS, heroSize: "40px", heroWeight: "600", heroSpacing: "-0.02em",
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
  StyleE: { name: "E · Soft mint (Diffchecker)", vars: {
    bg: "#f7f9f8", surface: "#ffffff", surface2: "#f7f9f8", border: "#e3e8e6", border2: "#edf1ef",
    text: "#1f2a26", text2: "#5f6b67", text3: "#98a39f", accent: "#1fb59a", track: "#c7f0e6", knob: "#1fb59a",
    add: "#a2e5d7", del: "#febdb0", rowAdd: "#e0f8f3", rowDel: "#feebe7", rowMix: "#fff6e0",
    radius: "12px", radiusSm: "8px", radiusXs: "6px", bw: "1px", cardBorder: "1px solid transparent", cardShadow: "0 1px 2px rgb(31 42 38 / 0.06), 0 6px 20px rgb(31 42 38 / 0.08)",
    font: SANS, fontPane: SANS, paneSize: "16px", fontHero: SANS, heroSize: "32px", heroWeight: "700", heroSpacing: "-0.01em",
    navBg: "#ffffff", paneHeadBg: "transparent", markRadius: "4px",
  }},
  StyleF: { name: "F · Monochrome, mono labels (Vercel/Geist)", vars: {
    bg: "#fafafa", surface: "#ffffff", surface2: "#fafafa", border: "#eaeaea", border2: "#f2f2f2",
    text: "#171717", text2: "#666666", text3: "#a3a3a3", accent: "#171717", track: "#171717", knob: "#ffffff",
    add: "#bbf7d0", del: "#fecaca", rowAdd: "#f0fdf4", rowDel: "#fef2f2", rowMix: "#fefce8",
    radius: "12px", radiusSm: "8px", radiusXs: "6px", bw: "1px", cardBorder: "1px solid transparent", cardShadow: "0 0 0 1px #eaeaea",
    font: SANS, fontPane: SANS, paneSize: "16px", fontHero: SANS, heroSize: "40px", heroWeight: "600", heroSpacing: "-0.04em",
    navBg: "#fafafa", paneHeadBg: "transparent", markRadius: "2px",
    labelFont: MONO, labelSize: "12px", labelSpacing: "0.02em",
  }},
  StyleG: { name: "G · Warm paper, humanist (justfont)", vars: {
    bg: "#fcfcfc", surface: "#ffffff", surface2: "#f7f6f4", border: "#e9e6e3", border2: "#f0eeeb",
    text: "#342c2c", text2: "#7a716f", text3: "#a8a19e", accent: "#66ac35", track: "#dcefcf", knob: "#66ac35",
    add: "#cfeabf", del: "#f6c9c4", rowAdd: "#f3f9ee", rowDel: "#fdf0ee", rowMix: "#fbf7e8",
    radius: "12px", radiusSm: "8px", radiusXs: "6px", bw: "1px", cardBorder: "1px solid #e9e6e3", cardShadow: "none",
    font: SANS, fontPane: SANS, paneSize: "16px", fontHero: SANS, heroSize: "34px", heroWeight: "500", heroSpacing: "0.04em",
    navBg: "#fcfcfc", paneHeadBg: "transparent", markRadius: "2px",
    paneSpacing: "0.03em", bodySpacing: "0.03em", heroTop: "72px",
  }},
  StyleH: { name: "H · Sharp, one loud accent (Bun)", vars: {
    bg: "#f5f3ef", surface: "#ffffff", surface2: "#f5f3ef", border: "#d9d4cc", border2: "#e9e5de",
    text: "#24211d", text2: "#6b655d", text3: "#a39c92", accent: "#ff1f8f", track: "#ff1f8f", knob: "#ffffff",
    add: "#bbf7d0", del: "#fecaca", rowAdd: "#f0fdf4", rowDel: "#fef2f2", rowMix: "#fefce8",
    radius: "3px", radiusSm: "2px", radiusXs: "2px", bw: "1px", cardBorder: "1px solid #d9d4cc", cardShadow: "none",
    font: SANS, fontPane: SANS, paneSize: "16px", fontHero: SANS, heroSize: "36px", heroWeight: "700", heroSpacing: "-0.02em",
    navBg: "#f5f3ef", paneHeadBg: "#f5f3ef", markRadius: "0",
    labelFont: MONO, labelSize: "12px", labelSpacing: "0",
  }},
  StyleA: { name: "A · Extension", vars: {
    bg: "#f9fafb", surface: "#ffffff", surface2: "#f9fafb", border: "#e5e7eb", border2: "#f3f4f6",
    text: "#111827", text2: "#6b7280", text3: "#9ca3af", accent: "#3b82f6", track: "#dbeafe", knob: "#3b82f6",
    add: "#bbf7d0", del: "#fecaca", rowAdd: "#f0fdf4", rowDel: "#fef2f2", rowMix: "#fefce8",
    radius: "12px", radiusSm: "8px", radiusXs: "6px", bw: "1px", cardBorder: "1px solid #e5e7eb", cardShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
    font: SANS, fontPane: SANS, paneSize: "16px", fontHero: SANS, heroSize: "30px", heroWeight: "700", heroSpacing: "-0.01em",
    navBg: "#ffffff", paneHeadBg: "transparent", markRadius: "2px",
  }},
  StyleB: { name: "B · Editor", vars: {
    bg: "#ffffff", surface: "#ffffff", surface2: "#f6f8fa", border: "#d0d7de", border2: "#d8dee4",
    text: "#1f2328", text2: "#57606a", text3: "#8c959f", accent: "#1f2328", track: "#1f2328", knob: "#ffffff",
    add: "#aceebb", del: "#ffc1c0", rowAdd: "#dafbe1", rowDel: "#ffebe9", rowMix: "#fff8c5",
    radius: "6px", radiusSm: "6px", radiusXs: "4px", bw: "1px", cardBorder: "1px solid #d0d7de", cardShadow: "none",
    font: SANS, fontPane: MONO, paneSize: "15px", fontHero: SANS, heroSize: "28px", heroWeight: "600", heroSpacing: "0",
    navBg: "#ffffff", paneHeadBg: "#f6f8fa", markRadius: "0",
  }},
  StyleC: { name: "C · Paper", vars: {
    bg: "#faf9f5", surface: "#ffffff", surface2: "#f5f3ec", border: "#e6e2d6", border2: "#efece3",
    text: "#1c1917", text2: "#6b6660", text3: "#9c968d", accent: "#0f766e", track: "#ccfbf1", knob: "#0f766e",
    add: "#bbf7d0", del: "#fecaca", rowAdd: "#eefbf0", rowDel: "#fdf1ef", rowMix: "#fbf8e6",
    radius: "14px", radiusSm: "10px", radiusXs: "8px", bw: "1px", cardBorder: "1px solid transparent", cardShadow: "0 1px 3px rgb(28 25 23 / 0.08), 0 8px 24px rgb(28 25 23 / 0.06)",
    font: SANS, fontPane: SANS, paneSize: "16px", fontHero: SERIF, heroSize: "36px", heroWeight: "600", heroSpacing: "-0.01em",
    navBg: "transparent", paneHeadBg: "transparent", markRadius: "3px",
  }},
  StyleD: { name: "D · Bold", vars: {
    bg: "#ffffff", surface: "#ffffff", surface2: "#fafafa", border: "#111827", border2: "#e5e7eb",
    text: "#111827", text2: "#52525b", text3: "#a1a1aa", accent: "#111827", track: "#111827", knob: "#ffffff",
    add: "#86efac", del: "#fca5a5", rowAdd: "#dcfce7", rowDel: "#fee2e2", rowMix: "#fef9c3",
    radius: "16px", radiusSm: "10px", radiusXs: "8px", bw: "2px", cardBorder: "2px solid #111827", cardShadow: "6px 6px 0 #111827",
    font: SANS, fontPane: SANS, paneSize: "16px", fontHero: SANS, heroSize: "44px", heroWeight: "800", heroSpacing: "-0.02em",
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
const pos = { StyleA: [0, 5200], StyleB: [1360, 5200], StyleC: [0, 6220], StyleD: [1360, 6220], StyleE: [0, 7240], StyleF: [1360, 7240], StyleG: [0, 8260], StyleH: [1360, 8260], StyleP: [0, 9280], StyleQ: [0, 10300], PhoneQ: [1760, 10300] };
for (const [file, d] of Object.entries(DIRS)) {
  idx.boards[`${file}.dc.html`] = { x: pos[file][0], y: pos[file][1], w: d.w ?? 1280, h: d.h ?? 900, title: d.name, is_interactive: true };
  if (!idx.order.includes(`${file}.dc.html`)) idx.order.push(`${file}.dc.html`);
}
idx.notes.t3 = { kind: "title1", maxW: 2640, text: "Round 2 · Style directions, same layout", w: 240, x: 0, y: 4900 };
idx.notes.n5 = { color: "blue", w: 320, x: 2720, y: 5200, text: "Same markup on all four, only tokens differ. A = the extension as is. B = GitHub-ish diff, monospace panes. C = warm paper, serif title, teal, no card border. D = black 2px borders, hard shadow, big title. No web fonts on any: system stacks only." };
idx.notes.n6 = { color: "green", w: 320, x: 2720, y: 7240, text: "E–H come from live sites, values read from their CSS. E = diffchecker.com (page #f7f9f8, mint #e0f8f3/#a2e5d7, coral #feebe7/#febdb0, shadow not border). F = vercel.com / shadcn (#fafafa, hairline ring, no color accent, mono labels, tight hero). G = justfont.com (#fcfcfc, ink #342c2c, green #66ac35, tracked lighter CJK type, 1.85 line-height). H = bun.com (warm neutral, #24211d, pink #ff1f8f, 3px corners, mono labels)." };
idx.notes.t4 = { kind: "title1", maxW: 1280, text: "Round 2 · Picked mix", w: 240, x: 0, y: 8980 };
idx.notes.n7 = { color: "blue", w: 320, x: 1360, y: 9280, text: "A as base. Hero from F (40px, 600, -0.04em). Main background #fafafa from F, navbar stays white. Diff colors from D (#86efac / #fca5a5 marks, #dcfce7 / #fee2e2 / #fef9c3 rows). Disabled toggle as the extension popup: track #f3f4f6, white knob, label #6b7280, no fade. Shell max-width 1280px, fluid below." };
idx.notes.n8 = { color: "green", w: 320, x: 1360, y: 10300, text: "Q = P with two changes from developer.apple.com/design. Neutral ink: text #1d1d1f, secondary #6e6e73, light fill #f5f5f7 (read from their CSS); border #e5e5e7 and tertiary #a1a1a6 are derived to match. Hero letter-spacing -0.02em, since the system stack renders SF on Apple devices and SF is already tight. Blue accent, diff colors, toggle unchanged." };
writeFileSync("project/canvas.json", JSON.stringify(idx, null, 2) + "\n");
