import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, "tokens.json"), "utf8"));

const GROUPS = ["color", "radius", "spacing", "font", "layout"];

function flatten(name, node, out) {
  if (node === null || typeof node !== "object") {
    out.push([name, String(node)]);
    return;
  }
  if ("base" in node) {
    out.push([name, String(node.base)]);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "sources") continue;
    const child = key.replaceAll(".", "-");
    flatten(name ? `${name}-${child}` : child, value, out);
  }
}

const PREFIX = (group) => (group === "color" ? "" : group);

const lines = [":root {"];
for (const group of GROUPS) {
  const entries = [];
  flatten(PREFIX(group), tokens[group], entries);
  for (const [name, value] of entries) {
    lines.push(`  --${name}: ${value};`);
  }
}
lines.push("}");

writeFileSync(join(here, "gen.css"), lines.join("\n") + "\n");
console.log("wrote design/gen.css (" + lines.length + " lines)");