import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const cmd = process.env.ComSpec || "cmd.exe";
const pre = ["/d", "/s", "/c", "pnpm"];
const build = spawnSync(cmd, [...pre, "-r", "build"], { cwd: root, stdio: "inherit" });
if (build.status !== 0) {
  console.error("workspace build failed");
  process.exit(build.status ?? 1);
}

const test = spawnSync(cmd, [...pre, "--filter", "@imagoro/blocks-registrations", "test"], {
  cwd: root,
  stdio: "inherit"
});
if (test.status !== 0) {
  console.error("block render tests failed");
  process.exit(test.status ?? 1);
}

const families = readdirSync(join(root, "blocks"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "registrations")
  .map((d) => d.name)
  .sort();

for (const f of families) {
  const src = readFileSync(join(root, "blocks", f, "src", "index.tsx"), "utf8");
  if (!src.includes("export const manifest")) {
    console.error(`manifest missing in blocks/${f}`);
    process.exit(1);
  }
}

mkdirSync(join(root, "output"), { recursive: true });
writeFileSync(
  join(root, "output", "M2_OK.txt"),
  `imagoro-ui M2 OK\nblocks=${families.length}\n${families.map((f) => ` - @imagoro/block-${f}`).join("\n")}\nreact renderer + registrations build & SSR tests green\nM1_OK=present:${existsSync(join(root, "output", "M1_OK.txt"))}\n`
);
console.log("M2_OK.txt written");