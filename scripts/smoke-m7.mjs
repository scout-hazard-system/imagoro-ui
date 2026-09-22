import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { verifyImageManifest } = await import("../packages/image/dist/index.js");

const json = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const exists = (p) => existsSync(join(root, p));
const read = (p) => readFileSync(join(root, p), "utf8");

const CHECK = [
  ["@imagoro/image package present", () => exists("packages/image/package.json")],
  ["image manifest types + builder + verifier sources", () =>
    exists("packages/image/src/types.ts") && exists("packages/image/src/manifest.ts") && exists("packages/image/src/verify.ts")],
  ["image tests present", () => exists("packages/image/src/manifest.test.ts")],
  ["substrate-neutral per-block manifest.ts (React-free)", () => {
    const blocks = ["map","route","metrics","audit","weather","visualizer","chat","console","terminal","blackboard","pipeline","graph"];
    return blocks.every((b) => exists(`blocks/${b}/src/manifest.ts`));
  }],
  ["block package.json exports ./manifest subpath", () => {
    const blocks = ["map","route","metrics","audit","weather","visualizer","chat","console","terminal","blackboard","pipeline","graph"];
    return blocks.every((b) => {
      const pkg = json(`blocks/${b}/package.json`);
      return pkg.exports && pkg.exports["./manifest"];
    });
  }],
  ["registrations React-free BLOCK_CATALOG + ./catalog export", () =>
    exists("blocks/registrations/src/catalog.ts") &&
    json("blocks/registrations/package.json").exports?.["./catalog"]],
  ["command-center image emission plugin", () => exists("apps/command-center/imagoro-image-plugin.ts")],
  ["vite config wires image plugin", () => read("apps/command-center/vite.config.ts").includes("imagoroImagePlugin")],
  ["emitted imagoro-image.json (run cc:build first)", () => exists("apps/command-center/dist/imagoro-image.json")],
  ["image manifest integrity self-check", () => {
    const img = json("apps/command-center/dist/imagoro-image.json");
    if (img.schema !== "imagoro.image/v1") return false;
    if (!Array.isArray(img.blocks) || img.blocks.length < 12) return false;
    if (!img.shell || !Array.isArray(img.shell.sections) || img.shell.sections.length < 1) return false;
    if (!img.integrity || img.integrity.algorithm !== "sha256" || !/^[0-9a-f]{64}$/.test(img.integrity.digest)) return false;
    if (!Array.isArray(img.dist) || img.dist.length < 1) return false;
    return img.dist.every((f) => typeof f.sha256 === "string" && f.sha256.length === 64 && f.bytes > 0);
  }],
  ["verifier round-trip on emitted manifest (hash + integrity)", async () => {
    const img = json("apps/command-center/dist/imagoro-image.json");
    const report = await verifyImageManifest(img, join(root, "apps", "command-center", "dist"));
    return report.ok;
  }]
];

const failed = [];
for (const [label, fn] of CHECK) {
  try {
    const ok = await fn();
    if (!ok) failed.push(label);
  } catch {
    failed.push(label);
  }
}
if (failed.length > 0) {
  console.error("smoke checks failed:", failed.join(", "));
  process.exit(1);
}

mkdirSync(join(root, "output"), { recursive: true });
const img = json("apps/command-center/dist/imagoro-image.json");
writeFileSync(
  join(root, "output", "M7_OK.txt"),
  `imagoro-ui M7 OK\n` +
  `schema=${img.schema} blocks=${img.blocks.length} dist-files=${img.dist.length}\n` +
  `image=${img.imageId}@${img.imageVersion} renderer=${img.renderer}\n` +
  `integrity=${img.integrity.digest}\n` +
  `smoke checks: ${CHECK.map(([c]) => c).join(" | ")}\n`
);
console.log("M7_OK.txt written");
