import { readFileSync, writeFileSync } from "node:fs";
const src = readFileSync("gen.mjs", "utf8");
const DIRS = eval(src.slice(src.indexOf("const SANS"), src.indexOf("const tpl")) + "; DIRS");
const tpl = readFileSync("template.html", "utf8");
const m = tpl.match(/const SAMPLE_IN = ("[^"]*");/); const SAMPLE_IN = JSON.parse(m[1]);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
for (const file of ["StyleP", "StyleQ"]) {
  const d = DIRS[file];
  const css = Object.entries(d.vars).map(([k, v]) => `      --${k}: ${v};`).join("\n");
  let h = tpl.replace("@@VARS@@", css)
    .replace('  <script src="./support.js"></script>\n', `  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>pangu.space · ${d.name}</title>\n`)
    .replace(/<x-dc>\n<helmet>\n/, "").replace(/<\/helmet>\n/, "").replace(/<\/x-dc>\n<script data-dc-script[\s\S]*<\/script>\n/, "")
    .replace(/\.page \{ width: [^;]+; height: [^;]+;/, ".page { min-height: 100vh;")
    .replace("@@EXTRA@@", `    @media (max-width: 640px) {\n${readFileSync("phone.css", "utf8")}    }\n`)
    .replace('disabled="{{ true }}"', "disabled").replace('checked="{{showDiff}}" onChange="{{toggleDiff}}"', "checked")
    .replace('value="{{source}}" onChange="{{setSource}}"></textarea>', `>${esc(SAMPLE_IN)}</textarea>`)
    .replace(/<sc-if value="\{\{plain\}\}"[\s\S]*?<\/sc-if>\n/, "")
    .replace(/<sc-if value="\{\{showDiff\}\}" hint-placeholder-val="\{\{ true \}\}">\n/g, "").replace(/<\/sc-if>\n/g, "");
  if (/\{\{|sc-if|helmet|x-dc/.test(h)) throw new Error(file + " leftovers");
  writeFileSync(`../preview/${file}.html`, h);
}
