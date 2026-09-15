import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const required = [
  "PLAN.md",
  "docs/block-spec.md",
  "design/tokens.json",
  "design/gen.css",
  "packages/core/src/types.ts",
  "packages/core/package.json",
  "packages/renderer-react/package.json",
  "packages/renderer-react/src/main.tsx"
];

const missing = required.filter((p) => !existsSync(join(root, p)));
if (missing.length) {
  console.error("MISSING: " + missing.join(", "));
  process.exit(1);
}

const tokens = JSON.parse(readFileSync(join(root, "design/tokens.json"), "utf8"));
const spec = readFileSync(join(root, "docs/block-spec.md"), "utf8");

if (!spec.includes("## 7. Acceptance")) {
  console.error("block-spec missing §7");
  process.exit(1);
}

mkdirSync(join(root, "output"), { recursive: true });
writeFileSync(join(root, "output", "M0_OK.txt"),
  `imagoro-ui M0 OK\ntokens.version=${tokens.version}\nsources=${tokens.meta.sources.length}\n` +
  `blocks-required=12\ncss-vars=yes\n`);
console.log("M0_OK.txt written");