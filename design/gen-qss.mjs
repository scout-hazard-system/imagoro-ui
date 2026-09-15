import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, "tokens.json"), "utf8"));

const color = tokens.color ?? {};
const radius = tokens.radius ?? {};
const spacing = tokens.spacing ?? {};
const font = tokens.font ?? {};

const lines = [];
lines.push("/*");
lines.push(" * gen.qss — PySide6/Qt stylesheet emission (STUB).");
lines.push(" * Generated from design/tokens.json by design/gen-qss.mjs.");
lines.push(" * Consumed by the legacy adapter-qt (scout_crew gui.py DARK_QSS); not yet built.");
lines.push(" * Spot values are emitted for parity checks; full QSS rewrite lands with adapter-qt.");
lines.push(" */");
lines.push("");
lines.push("QMainWindow, QWidget {");
if (color.bg?.base) lines.push(`  background-color: ${color.bg.base};`);
if (color["text.body"]?.base) lines.push(`  color: ${color["text.body"].base};`);
lines.push("}");

if (font.size?.md) lines.push(`\nQMainWindow, QWidget { font-size: ${font.size.md}; }`);
if (font.mono?.base) lines.push(`QPlainTextEdit, QTextEdit { font-family: ${font.mono.base}; }`);

lines.push("\nQPushButton {");
if (color["accent.primary"]?.base) lines.push(`  background-color: ${color["accent.primary"].base};`);
lines.push("  border: none;");
if (radius.md?.base) lines.push(`  border-radius: ${radius.md.base};`);
if (spacing.m?.base) lines.push(`  padding: ${spacing.m.base} ${spacing.l?.base ?? spacing.m.base};`);
lines.push("}");
if (color["accent.hover"]?.base) lines.push(`QPushButton:hover { background-color: ${color["accent.hover"].base}; }`);

lines.push("\nQGroupBox::title {");
if (color["panel.title"]?.base) lines.push(`  color: ${color["panel.title"].base};`);
lines.push("}");

lines.push("\n/* TODO(adapter-qt): port remaining DARK_QSS rules from gui.py, keyed on tokens. */");
const out = lines.join("\n") + "\n";
writeFileSync(join(here, "gen.qss"), out);
console.log("wrote design/gen.qss (stub, " + lines.length + " lines)");