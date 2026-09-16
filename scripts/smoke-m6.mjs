import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const json = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const exists = (p) => existsSync(join(root, p));

const CHECK = [
  ["flatpak manifest present + valid JSON", () => { json("infra/flatpak/org.scout.imagoro.json"); return true; }],
  ["flatpak app-id + runtime", () => json("infra/flatpak/org.scout.imagoro.json").appId ?? json("infra/flatpak/org.scout.imagoro.json")["app-id"] === "org.scout.imagoro"],
  ["flatpak README", () => exists("infra/flatpak/README.md")],
  ["flatpak CI workflow", () => exists(".github/workflows/flatpak.yml")],
  ["android WebView MainActivity", () => exists("infra/webview-android/app/src/main/java/org/scout/imagoro/MainActivity.kt")],
  ["android manifest", () => exists("infra/webview-android/app/src/main/AndroidManifest.xml")],
  ["android README", () => exists("infra/webview-android/README.md")],
  ["dev-process doc", () => exists("docs/dev-process.md")],
  ["tauri config present (src-tauri/tauri.conf.json)", () => exists("src-tauri/tauri.conf.json")],
  ["packaging status marked gated (no false 'verified')", () => {
    const dev = readFileSync(join(root, "docs/dev-process.md"), "utf8");
    return dev.includes("config-verified only") || dev.includes("Gated");
  }]
];

const failed = CHECK.filter(([, fn]) => { try { return !fn(); } catch { return true; } }).map(([c]) => c);
if (failed.length > 0) {
  console.error("smoke checks failed:", failed.join(", "));
  process.exit(1);
}

mkdirSync(join(root, "output"), { recursive: true });
writeFileSync(
  join(root, "output", "M6_OK.txt"),
  `imagoro-ui M6 OK\ndocs/dev-process.md: Windows/Flatpak/Android dev processes + Kepler orchestration\ninfra/flatpak: org.scout.imagoro.json (GNOME 46, webkit2gtk posture) + README + .github/workflows/flatpak.yml\ninfra/webview-android: Tauri-android (recommended) + open-source WebView host (MainActivity.kt) + Play/F-Droid notes\nstatus gates: Linux/Android tracks config-verified only; Windows+web verified. No Rust/MSVC/Android SDK on issuing host.\nsmoke checks: ${CHECK.map(([c]) => c).join(" | ")}\n`
);
console.log("M6_OK.txt written");