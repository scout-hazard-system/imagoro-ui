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
run(["--filter", "@imagoro/command-center", "test"], "command-center tests");
run(["--filter", "@imagoro/blocks-registrations", "test"], "block SSR tests");

const ccMain = readFileSync(join(root, "apps", "command-center", "src", "main.tsx"), "utf8");
const sectionsSrc = readFileSync(join(root, "apps", "command-center", "src", "sections.ts"), "utf8");
const tauriConf = JSON.parse(readFileSync(join(root, "infra", "tauri", "tauri.conf.json"), "utf8"));
const registrySrc = readFileSync(join(root, "blocks", "registrations", "src", "index.ts"), "utf8");

const checks = {
  "command-center registers all blocks": ccMain.includes("registerAll(host)"),
  "command-center replays fixtures": ccMain.includes("replayFixtures"),
  "command-center connects SSE": ccMain.includes("connectSse"),
  "sections compose registered ids": sectionsSrc.includes('"imagoro.graph"') && sectionsSrc.includes('"imagoro.blackboard"'),
  "canvas slot in crew tasks": sectionsSrc.includes('block: "imagoro.graph"'),
  "tauri conf valid JSON + points at cc dist":
    tauriConf.build.frontendDist === "../../apps/command-center/dist" && tauriConf.app.windows[0].label === "main",
  "tauri capabilities present": existsSync(join(root, "infra", "tauri", "src-tauri", "capabilities", "default.json")),
  "tauri rust sources present":
    existsSync(join(root, "infra", "tauri", "src-tauri", "src", "main.rs")) &&
    existsSync(join(root, "infra", "tauri", "src-tauri", "src", "lib.rs")) &&
    existsSync(join(root, "infra", "tauri", "src-tauri", "Cargo.toml")),
  "12 blocks registered": (registrySrc.match(/"imagoro\.[a-z.]+"/g) ?? []).length === 12
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([c]) => c);
if (failed.length > 0) {
  console.error("smoke checks failed:", failed.join(", "));
  process.exit(1);
}

mkdirSync(join(root, "output"), { recursive: true });
writeFileSync(
  join(root, "output", "M4_OK.txt"),
  `imagoro-ui M4 OK\napps/command-center: flagship Shell composes 12 blocks + node canvas in 5 sections (react only)\n  sections: ${readFileSync(join(root, "apps", "command-center", "src", "sections.ts"), "utf8").match(/id: "[a-z]+"/g)?.length} workspaces, cc tests green, vite bundle built\ninfra/tauri: v2 scaffold (tauri.conf.json + src-tauri + capabilities defaults)\n  NOTE: desktop build VERIFIED-ready-ONLY - Rust toolchain not on host (see infra/tauri/README.md)\nsmoke checks: ${Object.keys(checks).join(", ")}\nM1_OK=present:${existsSync(join(root, "output", "M1_OK.txt"))}\nM2_OK=present:${existsSync(join(root, "output", "M2_OK.txt"))}\nM3_OK=present:${existsSync(join(root, "output", "M3_OK.txt"))}\n`
);
console.log("M4_OK.txt written");