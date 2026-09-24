import { cpSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// No bundler: the page imports these files as plain ES modules
const out = new URL("../public/vendor/", import.meta.url);
mkdirSync(new URL("diff/", out), { recursive: true });

for (const [source, name] of [
  // pangu/browser resolves to the bundler build, whose imports point at sibling files. pangu.js next to it is the self-contained single file, which the exports map does not expose
  [new URL("pangu.js", import.meta.resolve("pangu/browser")), "pangu.js"],
  [import.meta.resolve("diff/lib/diff/character.js"), "diff/character.js"],
  [import.meta.resolve("diff/lib/diff/base.js"), "diff/base.js"],
]) {
  cpSync(fileURLToPath(source), fileURLToPath(new URL(name, out)));
}
