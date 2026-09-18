import { cpSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// No bundler: the page imports these files as plain ES modules
const out = new URL("../public/vendor/", import.meta.url);
mkdirSync(new URL("diff/", out), { recursive: true });

for (const [specifier, name] of [
  ["pangu/browser", "pangu.js"],
  ["diff/lib/diff/character.js", "diff/character.js"],
  ["diff/lib/diff/base.js", "diff/base.js"],
]) {
  cpSync(fileURLToPath(import.meta.resolve(specifier)), fileURLToPath(new URL(name, out)));
}
