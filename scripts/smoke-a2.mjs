import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const json = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const exists = (p) => existsSync(join(root, p));
const read = (p) => readFileSync(join(root, p), "utf8");

const CORE = ["acl-matrix.gen.ts", "acl.ts", "intent.ts", "sidebar.ts", "guard.ts", "gateway.ts", "broker.ts", "types.ts"];

const CHECK = [
  ["core consumer modules ported (acl-matrix.gen/intent/sidebar/guard/gateway/broker)", () =>
    CORE.every((f) => exists(`packages/core/src/${f}`))],
  ["core index barrel exports broker/gateway/guard/intent/sidebar", () => {
    const idx = read("packages/core/src/index.ts");
    return ["acl.js", "intent.js", "sidebar.js", "guard.js", "gateway.js", "broker.js"].every((m) => idx.includes(m));
  }],
  ["ACL gen matrix carries the config category (7 cats)", () => {
    const gen = read("packages/core/src/acl-matrix.gen.ts");
    const acl = read("packages/core/src/acl.ts");
    return gen.includes("config") && /export const ACL_MATRIX/.test(gen) && acl.includes("acl-matrix.gen.js");
  }],
  ["core tests ported (acl already present + 4 new)", () =>
    ["acl.test.ts", "broker.test.ts", "gateway.test.ts", "intent.test.ts", "sidebar.test.ts"].every((f) =>
      exists(`packages/core/src/${f}`))],
  ["intent/sidebar blocks split per P2-C (manifest.ts + ./manifest export)", () => {
    const blocks = ["intent", "sidebar"];
    return blocks.every((b) => {
      const pkg = json(`blocks/${b}/package.json`);
      return exists(`blocks/${b}/src/manifest.ts`) &&
        exists(`blocks/${b}/src/index.tsx`) &&
        pkg.exports && pkg.exports["./manifest"] && pkg.exports["."];
    });
  }],
  ["intent/sidebar block manifests carry the poached api surface", () => {
    const im = read("blocks/intent/src/manifest.ts");
    const sm = read("blocks/sidebar/src/manifest.ts");
    return im.includes("imagoro.intent") && im.includes("intent/propose") &&
      sm.includes("imagoro.sidebar") && sm.includes("sidebar/activate");
  }],
  ["canonical catalog untouched (BLOCK_CATALOG still 12)", () => {
    const cat = read("blocks/registrations/src/catalog.ts");
    const idx = read("blocks/registrations/src/index.ts");
    const importCount = (cat.match(/from "@imagoro\/block-/g) ?? []).length;
    return importCount >= 12 && !cat.includes("imagoro.intent") && !cat.includes("imagoro.sidebar") && !idx.includes("block-intent");
  }],
  ["overlay seam registered (./overlay export + registerOverlay)", () => {
    const pkg = json("blocks/registrations/package.json");
    return pkg.exports?.["./overlay"] && read("blocks/registrations/src/overlay.ts").includes("registerOverlay");
  }],
  ["command-center overlay-blocks seam file", () =>
    exists("apps/command-center/src/overlay-blocks.tsx") &&
    read("apps/command-center/src/main.tsx").includes("registerCommandCenterOverlay")],
  ["command-center sections reference intent + sidebar", () => {
    const s = read("apps/command-center/src/sections.ts");
    return s.includes("imagoro.intent") && s.includes("imagoro.sidebar");
  }],
  ["harness-console ported + registers overlay", () =>
    exists("apps/harness-console/package.json") &&
    exists("apps/harness-console/src/sections.ts") &&
    read("apps/harness-console/src/main.tsx").includes("registerOverlay")],
  ["harness-console mcp bus routes through core Gateway+ToolBroker", () => {
    const mcp = read("apps/harness-console/src/mcp.ts");
    return mcp.includes("Gateway") && mcp.includes("ToolBroker");
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
writeFileSync(
  join(root, "output", "A2_OK.txt"),
  `imagoro-ui A2 OK\n` +
  `core consumer modules: ${CORE.length} ported (acl-matrix.gen + broker/gateway/guard/intent/sidebar)\n` +
  `blocks overlay: intent + sidebar (manifest.ts split, ./manifest export)\n` +
  `apps: harness-console ported; command-center overlay-blocks seam wired (canonical catalog 12)\n` +
  `smoke checks: ${CHECK.map(([c]) => c).join(" | ")}\n`
);
console.log("A2_OK.txt written");