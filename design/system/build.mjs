// Derives the Design System artifact's generated files from the site's real stylesheets
// web/public/tokens.css stays the source of truth; never edit project/tokens.json by hand
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const web = new URL("../../web/public/", import.meta.url);
const out = new URL("./project/", import.meta.url);
const css = readFileSync(new URL("tokens.css", web), "utf8");
const vars = Object.fromEntries([...css.matchAll(/^\s*--([\w-]+):\s*(.+);$/gm)].map((m) => [m[1], m[2]]));

// A usage note on every token; a token without one here fails the build
const USAGE = {
  "color-primary": "Accent. Toggle knob when on, focus rings, link and button hover. As text it is 3.68:1 on color-surface, so never use it for small resting text.",
  "color-primary-light": "Toggle track when on.",
  "color-surface": "Cards, the navbar, buttons, selects.",
  "color-surface-secondary": "The page ground behind cards, and the legend strip inside a card.",
  "color-surface-tertiary": "Toggle track when off or disabled.",
  "color-border": "Card, control, navbar and footer borders. Decorative, 1.26:1 on color-surface.",
  "color-border-light": "The divider under a pane header.",
  "color-text-primary": "Headlines, body and control text on color-surface and color-surface-secondary. 16.8:1.",
  "color-text-secondary": "Descriptions, pane labels, notes, footer text on color-surface (5.07:1) and color-surface-secondary (4.86:1).",
  "color-text-tertiary": "Separators and placeholder text only. 2.57:1 on color-surface, below the 4.5:1 floor, kept exact from the source. Never use it for text that must be read.",
  "color-text-on-primary": "Text on color-text-primary fills, such as the main button. 16.8:1.",
  "color-success": "Text for add, save and active status, on color-surface (5.02:1) and on color-success-light (4.57:1).",
  "color-success-light": "Fill of a soft green button or an active status.",
  "color-success-light-hover": "Hover fill of a soft green button.",
  "color-success-border": "Border of a soft green button.",
  "color-success-border-hover": "Hover border of a soft green button.",
  "color-danger": "Text for destructive actions such as remove and restore defaults, on color-surface (6.47:1) and on color-danger-light (5.30:1).",
  "color-danger-light": "Fill of a soft red button.",
  "color-danger-light-hover": "Hover fill of a soft red button. Same value as color-danger-border, as in the source.",
  "color-danger-border": "Border of a soft red button.",
  "color-danger-border-hover": "Hover border of a soft red button.",
  "color-info": "Text of a neutral notification, on color-info-light (5.17:1).",
  "color-info-light": "Fill of a neutral notification.",
  "color-info-border": "Border of a neutral notification.",
  "color-diff-add": "Highlight behind an added space in the diff.",
  "color-diff-del": "Mark where a removed space was, and the Removed swatch in the legend.",
  "color-diff-row-add": "Row tint for a line that only gained spaces.",
  "color-diff-row-del": "Row tint for a line that only lost spaces.",
  "color-diff-row-mix": "Row tint for a line that both gained and lost spaces.",
  "shadow-sm": "Cards.",
  "shadow": "The toggle knob.",
  "shadow-lg": "Overlays that float above the page, such as a notification. Never on a card.",

  "text-sm": "The diff legend. 14px.",
  "text-base": "Pane text and labels, nav links, every control, notes and the footer. 16px.",
  "text-lg": "The description under the page headline. 18px.",
  "text-xl": "Section titles. 22px.",
  "text-2xl": "The headline under 640px. 24px.",
  "text-3xl": "The one headline size. 40px.",
  "spacing-1": "Wrapped toolbar rows on phones.",
  "spacing-2": "Logo to name, headline to description, toggle to its label, legend swatch to label.",
  "spacing-3": "Button and select padding. Toolbar padding.",
  "spacing-4": "Card and pane padding. Page gutter under 640px.",
  "spacing-5": "Footer padding under 640px.",
  "spacing-6": "Between nav links, between toolbar controls.",
  "spacing-8": "Page gutter, gaps between page sections.",
  "spacing-10": "Below the tool.",
  "spacing-12": "Above the headline.",
  "radius-sm": "Buttons.",
  "radius": "Selects.",
  "radius-lg": "Cards.",
  "radius-full": "Toggle track and knob.",
};

const entry = (name) => {
  if (!(name in vars)) throw new Error(`USAGE names --${name}, which tokens.css no longer defines`);
  if (!USAGE[name]) throw new Error(`--${name} has no usage note`);
  return { name, value: vars[name], usage: USAGE[name] };
};
const family = (prefix) => Object.keys(vars).filter((n) => n === prefix || n.startsWith(prefix + "-")).map(entry);
const handled = new Set([...Object.keys(USAGE), "font-sans", "font-mono", "transition-fast", "transition"]);
const missed = Object.keys(vars).filter((n) => !handled.has(n));
if (missed.length) throw new Error(`tokens.css defines tokens this build does not place: ${missed.join(", ")}`);

// Without an argument the stamp is kept, so a plain rebuild never rewrites it
function previousRef() {
  try {
    return JSON.parse(readFileSync(new URL("tokens.json", out), "utf8")).meta.ref;
  } catch {
    return undefined;
  }
}

const style = (name, fontSize, fontWeight, lineHeight, usage, extra = {}) => ({ name, fontSize, fontWeight, lineHeight, usage, ...extra });
const tokens = {
  name: "pangu",
  version: 1,
  meta: {
    source: "github",
    repo: "vinta/pangu.space",
    ref: process.argv[2] ?? previousRef() ?? "main",
    paths: { tokens: ["web/public/tokens.css"], components: ["web/public/styles.css"], assets: ["web/public/favicon.svg"] },
    synced: new Date().toISOString().slice(0, 10),
  },
  color: { themes: [{ id: "light", name: "Light" }], tokens: family("color") },
  type: {
    fonts: [],
    families: { sans: vars["font-sans"], mono: vars["font-mono"] },
    groups: [
      {
        name: "Text",
        family: "sans",
        styles: [
          style("headline", vars["text-3xl"], 600, 1.2, "The page headline. One per page.", { sample: "Paranoid Text Spacing" }),
          style("headline-phone", vars["text-2xl"], 600, 1.2, "The headline under 640px.", { sample: "Paranoid Text Spacing" }),
          style("section-title", vars["text-xl"], 600, 1.25, "Titles of page sections.", { sample: "Blacklist" }),

          style("subtitle", vars["text-lg"], 400, 1.5, "The description under the headline, in color-text-secondary."),

          style("body", vars["text-base"], 400, 1.5, "Notes and the footer, in color-text-secondary."),
          style("pane", vars["text-base"], 400, 1.8, "Text in the panes and diff rows. The tall line height keeps mixed Chinese and Latin lines even.", { sample: "當你凝視著 bug，bug 也凝視著你" }),
          style("brand", vars["text-base"], 700, 1.5, "The site name beside the logo.", { sample: "pangu.space" }),
          style("nav", vars["text-base"], 500, 1.5, "Nav links."),
          style("label", vars["text-base"], 600, 1.5, "Pane labels, in color-text-secondary."),
          style("control", vars["text-base"], 500, 1.5, "Toggle labels, buttons and selects. Controls are never smaller than this."),

          style("legend", vars["text-sm"], 400, 1.5, "The diff legend."),
        ],
      },

      {
        name: "Code",
        family: "mono",
        styles: [style("mono", vars["text-base"], 400, 1.5, "URLs, code and patterns the reader must read character by character.", { sample: "https://pangu.space/*" })],
      },
    ],
  },
  spacing: { tokens: family("spacing") },
  radius: { tokens: family("radius") },
  shadow: { tokens: family("shadow") },
  // Plain lengths the component stylesheet reads as custom properties
  fontSize: { note: "The type styles above use these. Components read them as custom properties.", tokens: family("text") },
};

mkdirSync(new URL("components/", out), { recursive: true });
writeFileSync(new URL("tokens.json", out), JSON.stringify(tokens, null, 2) + "\n");

// The token format has no motion family, so the two transitions ride with the component stylesheet
const motion = `:root {\n  --transition-fast: ${vars["transition-fast"]};\n  --transition: ${vars["transition"]};\n}\n\n`;
writeFileSync(new URL("components/bundle.css", out), motion + readFileSync(new URL("styles.css", web), "utf8"));
console.log(`tokens.json: ${tokens.color.tokens.length} colors, ${tokens.type.groups[0].styles.length} type styles, ${tokens.spacing.tokens.length} spacing, ${tokens.radius.tokens.length} radii, ${tokens.shadow.tokens.length} shadows, ${tokens.fontSize.tokens.length} font sizes`);
