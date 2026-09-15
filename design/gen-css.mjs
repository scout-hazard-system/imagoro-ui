import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, "tokens.json"), "utf8"));

const GLOBAL = ["color", "radius", "spacing", "font", "layout"];
const lines = [":root {"];

for (const group of GLOBAL) {
  const g = tokens[group];
  if (!g) continue;
  for (const [name, t] of Object.entries(g)) {
    if (typeof t !== "object" || !("base" in t)) continue;
    let cssName = name.replaceAll(".", "-");
    if (group === "color") cssName = "--" + cssName;
    else cssName = "--" + group + "-" + cssName;
    lines.push(`  ${cssName}: ${t.base};`);
  }
}

lines.push("}");
const out = lines.join("\n") + "\n";
writeFileSync(join(here, "gen.css"), out);
console.log("wrote design/gen.css (" + lines.length + " lines)");