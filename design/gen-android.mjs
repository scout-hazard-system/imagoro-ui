import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, "tokens.json"), "utf8"));

const color = tokens.color ?? {};

const lines = [];
lines.push("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
lines.push("<!--");
lines.push("  gen.colors.xml — Android resource emission (STUB).");
lines.push("  Generated from design/tokens.json by design/gen-android.mjs.");
lines.push("  Consumed by webview-android / Compose (M6); not yet used by SecureMesh adapters.");
lines.push("  Naming mirrors legacy values/colors.xml (bg_main, text_primary, ...).");
lines.push("-->");
lines.push("<resources>");

const emission = [
  ["bg_main", "bg"],
  ["bg_surface", "bg.surface"],
  ["bg_overlay", "bg.overlay"],
  ["bg_input", "bg.input"],
  ["text_primary", "text"],
  ["text_muted", "text.muted"],
  ["text_strong", "text.strong"],
  ["accent", "accent"],
  ["accent_dark", "accent.dark"],
  ["accent_hover", "accent.hover"],
  ["chip_ok", "chip.ok"],
  ["chip_warn", "chip.warn"],
  ["chip_bg", "chip.bg"],
  ["border", "border"],
];

for (const [resName, tokenId] of emission) {
  const t = tokenId in color ? color[tokenId] : undefined;
  if (!t?.base) continue;
  // Colors that are rgba() can't go into an Android <color> resource as-is; keep hex only.
  if (!/^#[0-9A-Fa-f]{6}$/.test(t.base)) continue;
  lines.push(`    <color name="${resName}">${t.base}</color>`);
}

lines.push("</resources>");
const out = lines.join("\n") + "\n";
writeFileSync(join(here, "gen.colors.xml"), out);
console.log("wrote design/gen.colors.xml (stub, " + lines.length + " lines)");