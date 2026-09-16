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
run(["--filter", "@imagoro/core", "test"], "core tests (incl ACL)");
run(["--filter", "@imagoro/blocks-registrations", "test"], "block SSR tests");
run(["--filter", "@imagoro/command-center", "test"], "command-center tests");

const aclSrc = readFileSync(join(root, "packages", "core", "src", "acl.ts"), "utf8");
const eventbusSrc = readFileSync(join(root, "packages", "core", "src", "eventbus.ts"), "utf8");
const blackboardSrc = readFileSync(join(root, "blocks", "blackboard", "src", "index.tsx"), "utf8");
const fixturesSrc = readFileSync(join(root, "packages", "core", "fixtures", "events.json"), "utf8");

const checks = {
  "role matrix defined": aclSrc.includes("ACL_MATRIX") && aclSrc.includes('"enterprise"'),
  "read/write gates exported": aclSrc.includes("export function canRead") && aclSrc.includes("export function canWrite"),
  "maskSnapshot implemented": aclSrc.includes("export function maskSnapshot"),
  "BlackboardClient gate on write": eventbusSrc.includes("blackboard write denied"),
  "BlackboardClient accepts role": eventbusSrc.includes("role?: Role"),
  "blackboard block surfaces role": blackboardSrc.includes("ROLE_LABEL") && blackboardSrc.includes("maskSnapshot"),
  "fixture blackboard map multi-category": fixturesSrc.includes('"audit": { "exported": 42')
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([c]) => c);
if (failed.length > 0) {
  console.error("smoke checks failed:", failed.join(", "));
  process.exit(1);
}

mkdirSync(join(root, "output"), { recursive: true });
writeFileSync(
  join(root, "output", "M5_OK.txt"),
  `imagoro-ui M5 OK\npackages/core acl.ts: role matrix personal/business/enterprise, canRead/canWrite/maskSnapshot/scopeFor (hierarchy enterprise>=business>=personal)\nBlackboardClient: write gated by role ACL, role option in client options\nblocks/blackboard: role badge + ACL category masking on snapshots\nfixtures: blackboard snapshot now multi-category (pipeline/crew/audit) for ACL demo\nsmoke checks: ${Object.keys(checks).join(", ")}\nM4_OK=present:${existsSync(join(root, "output", "M4_OK.txt"))}\n`
);
console.log("M5_OK.txt written");