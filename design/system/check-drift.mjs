// Fails when the pangu.js extension's tokens drift from web/public/tokens.css
// Usage: node check-drift.mjs [path to the extension's styles.css]
import { readFileSync } from "node:fs";

const site = new URL("../../web/public/tokens.css", import.meta.url);
const extension = process.argv[2] ?? new URL("../../../pangu.js/browser-extensions/chrome/stylesheets/styles.css", import.meta.url);

// Quote style differs between the repos' formatters
const parse = (file) => Object.fromEntries([...readFileSync(file, "utf8").matchAll(/^\s*--([\w-]+):\s*(.+);$/gm)].map((m) => [m[1], m[2].replaceAll("'", '"')]));
const shared = parse(site);
const theirs = parse(extension);

// The extension has no diff view
const exempt = (name) => name.startsWith("color-diff-");

const problems = [];
for (const [name, value] of Object.entries(shared)) {
  if (exempt(name)) continue;
  if (!(name in theirs)) problems.push(`missing in the extension: --${name}`);
  else if (theirs[name] !== value) problems.push(`--${name}: site ${value}, extension ${theirs[name]}`);
}

const extras = Object.keys(theirs).filter((name) => !(name in shared));
if (extras.length) console.log(`extension-only tokens: ${extras.map((n) => "--" + n).join(", ")}`);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${Object.keys(shared).filter((n) => !exempt(n)).length} shared tokens match`);
