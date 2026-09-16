import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const cmd = process.env.ComSpec || "cmd.exe";
const pre = ["/d", "/s", "/c", "pnpm"];
const run = (args, label) => {
  const res = spawnSync(cmd, [...pre, ...args], { cwd: root, stdio: "inherit" });
  if (res.status !== 0) {
    console.error(`${label} failed`);
    process.exit(res.status ?? 1);
  }
};

run(["-r", "build"], "workspace build");
run(["--filter", "@imagoro/canvas", "test"], "canvas tests");
run(["--filter", "@imagoro/blocks-registrations", "test"], "block SSR tests");

const registrationsSrc = readFileSync(join(root, "blocks", "registrations", "src", "index.ts"), "utf8");
const typesSrc = readFileSync(join(root, "packages", "core", "src", "types.ts"), "utf8");
const modelSrc = readFileSync(join(root, "packages", "canvas", "src", "model.ts"), "utf8");

const checks = {
  "graph block registered": registrationsSrc.includes('"imagoro.graph"'),
  "graph family in union": typesSrc.includes('| "graph"'),
  "connect/cycle guard exported": modelSrc.includes("export function connect"),
  "serialize/load": modelSrc.includes("export function serializeGraph") && modelSrc.includes("export function loadGraph"),
  "tasks.yaml importer": readFileSync(join(root, "packages", "canvas", "src", "tasksYaml.ts"), "utf8").includes("importTasksYaml"),
  "dag layout": readFileSync(join(root, "packages", "canvas", "src", "layout.ts"), "utf8").includes("layoutDag")
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([c]) => c);
if (failed.length > 0) {
  console.error("smoke checks failed:", failed.join(", "));
  process.exit(1);
}

const registeredIds = [...(registrationsSrc.match(/"imagoro\.[a-z.]+"/g) ?? [])].filter((v) => v !== '"imagoro.graph"').length + 1;
mkdirSync(join(root, "output"), { recursive: true });
writeFileSync(
  join(root, "output", "M3_OK.txt"),
  `imagoro-ui M3 OK\npackages/canvas: graph model + DAG import + layout (vitest green)\nblocks/graph: node canvas block (pan/zoom/drag-connect, demo crew DAG)\nblocks registered=${registeredIds}\nsmoke checks: ${Object.keys(checks).join(", ")}\nM1_OK=present:${existsSync(join(root, "output", "M1_OK.txt"))}\nM2_OK=present:${existsSync(join(root, "output", "M2_OK.txt"))}\n`
);
console.log("M3_OK.txt written");