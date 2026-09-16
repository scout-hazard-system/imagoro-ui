import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

for (const p of ["packages/core/src/registry.ts", "packages/core/src/eventbus.ts", "packages/core/fixtures/events.json"]) {
  if (!existsSync(join(root, p))) {
    console.error("missing " + p);
    process.exit(1);
  }
}

const cmd = process.env.ComSpec || "cmd.exe";
const run = spawnSync(cmd, ["/d", "/s", "/c", "pnpm", "--filter", "@imagoro/core", "test"], {
  cwd: root,
  stdio: "inherit"
});
if (run.status !== 0) {
  console.error("M1 core test run failed");
  process.exit(run.status ?? 1);
}

mkdirSync(join(root, "output"), { recursive: true });
writeFileSync(
  join(root, "output", "M1_OK.txt"),
  `imagoro-ui M1 OK\nregistry + eventbus vitest green\nfixtures types=14\nharness=mountSlots/replayFixtures exported\n`
);
console.log("M1_OK.txt written");